import { describe, it, expect } from "vitest";
import { redactSensitiveData, isSensitiveKey } from "../src/common.js";

describe("isSensitiveKey", () => {
    it("flags exact credential field names", () => {
        expect(isSensitiveKey("password")).toBe(true);
        expect(isSensitiveKey("secret")).toBe(true);
        expect(isSensitiveKey("token")).toBe(true);
        expect(isSensitiveKey("api_key")).toBe(true);
        expect(isSensitiveKey("private_key")).toBe(true);
        expect(isSensitiveKey("client_secret")).toBe(true);
        expect(isSensitiveKey("authorization")).toBe(true);
        expect(isSensitiveKey("passphrase")).toBe(true);
    });

    it("is case-insensitive", () => {
        expect(isSensitiveKey("Password")).toBe(true);
        expect(isSensitiveKey("API_KEY")).toBe(true);
        expect(isSensitiveKey("ClientSecret".toLowerCase())).toBe(false); // not in our exact set
        expect(isSensitiveKey("CLIENT_SECRET")).toBe(true);
    });

    it("treats a bare 'key' as sensitive ONLY inside a config/auth/secrets subtree", () => {
        // Outside a credential container, a field literally named "key" is allowed
        // (e.g. a map/index key), to avoid over-redacting legitimate fields.
        expect(isSensitiveKey("key")).toBe(false);
        // Inside a credential container it is redacted.
        expect(isSensitiveKey("key", true)).toBe(true);
    });

    it("flags keys via sensitive suffix", () => {
        expect(isSensitiveKey("db_password")).toBe(true);
        expect(isSensitiveKey("aws_secret_access_key")).toBe(true);
        expect(isSensitiveKey("user_token")).toBe(true);
        expect(isSensitiveKey("ssh_passphrase")).toBe(true);
    });

    it("does NOT flag innocuous keys that overlap with old substring rule", () => {
        // These were false positives under the old substring matcher
        expect(isSensitiveKey("api_key_id")).toBe(false);
        expect(isSensitiveKey("auth_type")).toBe(false);
        expect(isSensitiveKey("authentication_type")).toBe(false);
        expect(isSensitiveKey("cert_count")).toBe(false);
        expect(isSensitiveKey("certificate_authority")).toBe(false);
        expect(isSensitiveKey("next_cursor")).toBe(false);
        expect(isSensitiveKey("keyspace")).toBe(false);
        expect(isSensitiveKey("service")).toBe(false);
        expect(isSensitiveKey("private_endpoint_name")).toBe(false);
    });
});

describe("redactSensitiveData", () => {
    it("redacts sensitive top-level keys", () => {
        const input = { password: "hunter2", username: "alice" };
        const out = redactSensitiveData(input);
        expect(out.password).toBe("[REDACTED]");
        expect(out.username).toBe("alice");
    });

    it("redacts recursively through nested objects", () => {
        const input = {
            config: {
                api_key: "abc",
                host: "db.example.com",
                inner: { client_secret: "xyz", region: "us-east-1" },
            },
        };
        const out = redactSensitiveData(input);
        expect(out.config.api_key).toBe("[REDACTED]");
        expect(out.config.host).toBe("db.example.com");
        expect(out.config.inner.client_secret).toBe("[REDACTED]");
        expect(out.config.inner.region).toBe("us-east-1");
    });

    it("redacts inside arrays of objects", () => {
        const input = {
            items: [
                { name: "a", token: "t1" },
                { name: "b", token: "t2" },
            ],
        };
        const out = redactSensitiveData(input);
        expect(out.items[0].token).toBe("[REDACTED]");
        expect(out.items[1].token).toBe("[REDACTED]");
        expect(out.items[0].name).toBe("a");
    });

    it("preserves innocuous keys that the old matcher would have nuked", () => {
        const input = {
            api_key_id: "xxx-yyy",
            auth_type: "OAUTH",
            cert_count: 5,
            next_cursor: "abc123",
            service: "snowflake",
        };
        const out = redactSensitiveData(input);
        expect(out).toEqual(input);
    });

    it("leaves a bare 'key' alone outside a credential container", () => {
        const input = { key: "PK-123", value: "v", partition: { key: "shard-1" } };
        const out = redactSensitiveData(input);
        expect(out.key).toBe("PK-123");
        expect(out.partition.key).toBe("shard-1");
    });

    it("redacts a bare 'key' nested under config / auth containers", () => {
        const input = {
            config: { key: "secret-key-1", host: "db" },
            auth: { key: "secret-key-2" },
        };
        const out = redactSensitiveData(input);
        expect(out.config.key).toBe("[REDACTED]");
        expect(out.config.host).toBe("db");
        expect(out.auth.key).toBe("[REDACTED]");
    });

    it("wholesale-redacts secrets / credentials subtrees (they are exact-sensitive keys)", () => {
        const input = { secrets: { key: "x" }, credentials: { key: "y" } };
        const out = redactSensitiveData(input);
        expect(out.secrets).toBe("[REDACTED]");
        expect(out.credentials).toBe("[REDACTED]");
    });

    it("propagates the credential-container context to deeper descendants", () => {
        const input = { config: { nested: { deeper: { key: "still-secret" } } } };
        const out = redactSensitiveData(input);
        expect(out.config.nested.deeper.key).toBe("[REDACTED]");
    });

    it("does not mutate the input", () => {
        const input = { password: "p", nested: { secret: "s" } };
        const snapshot = JSON.parse(JSON.stringify(input));
        redactSensitiveData(input);
        expect(input).toEqual(snapshot);
    });

    it("passes through primitives", () => {
        expect(redactSensitiveData(null)).toBe(null);
        expect(redactSensitiveData(undefined)).toBe(undefined);
        expect(redactSensitiveData(42)).toBe(42);
        expect(redactSensitiveData("plain")).toBe("plain");
    });
});
