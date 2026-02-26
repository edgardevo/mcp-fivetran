import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeRequest } from "./common.js";

export function registerGeneratedTools(server: McpServer) {
  server.tool(
    "get_user_memberships_in_groups",
    "List All Group Memberships",
    {
    userid: z.string().describe("The unique identifier for the user within the account."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/users/${args.userid}/groups`, params);
    }
  );

  server.tool(
    "group_details",
    "Retrieve Group Details",
    {
    groupid: z.string().describe("The unique identifier for the group within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/groups/${args.groupid}`);
    }
  );

  server.tool(
    "get_account_info",
    "Get Account Info from the API Key",
    {

    },
    async (args) => {
      return await makeRequest('GET', `/account/info`);
    }
  );

  server.tool(
    "get_hybrid_deployment_agent_list",
    "List Hybrid Deployment Agents",
    {
    groupid: z.string().describe("The Fivetran Group Id.").optional(),
    cursor: z.string().describe("No description.").optional(),
    limit: z.number().describe("No description.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.groupid !== undefined) params['groupId'] = args.groupid;
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/hybrid-deployment-agents`, params);
    }
  );

  server.tool(
    "get_team_memberships_in_groups",
    "List All Group Memberships",
    {
    teamid: z.string().describe("The unique identifier for the team within the account."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/teams/${args.teamid}/groups`, params);
    }
  );

  server.tool(
    "metadata_connectors",
    "Retrieve Source Metadata",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/metadata/connector-types`, params);
    }
  );

  server.tool(
    "get_team_membership_in_group",
    "Retrieve Group Membership Details",
    {
    teamid: z.string().describe("The unique identifier for the team within the account."),
    groupid: z.string().describe("The unique identifier for the group within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/teams/${args.teamid}/groups/${args.groupid}`);
    }
  );

  server.tool(
    "get_connection_fingerprints_list",
    "List Fingerprints Approved for the Connection",
    {
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/connections/${args.connectionid}/fingerprints`, params);
    }
  );

  server.tool(
    "transformation_package_metadata_list",
    "List All Quickstart Package Metadata",
    {
    service: z.string().describe("Specify the service identifier to filter Quickstart packages by connection service").optional(),
    name: z.string().describe("Specify the package name to filter Quickstart packages by name").optional(),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.service !== undefined) params['service'] = args.service;
      if (args.name !== undefined) params['name'] = args.name;
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/transformations/package-metadata`, params);
    }
  );

  server.tool(
    "connection_column_config",
    "Retrieve Source Table Columns Config",
    {
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system."),
    schema: z.string().describe("The database schema name within your destination"),
    table: z.string().describe("The table name within your database schema")
    },
    async (args) => {
      return await makeRequest('GET', `/connections/${args.connectionid}/schemas/${args.schema}/tables/${args.table}/columns`);
    }
  );

  server.tool(
    "get_destination_fingerprints_list",
    "List Fingerprints Approved for the Destination",
    {
    destinationid: z.string().describe("The unique identifier for the destination within the Fivetran system."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/destinations/${args.destinationid}/fingerprints`, params);
    }
  );

  server.tool(
    "get_connection_certificate_details",
    "Retrieve Connection Certificate Details",
    {
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system."),
    hash: z.string().describe("The unique identifier of the certificate (Base64URL encoded hash of the certificate).")
    },
    async (args) => {
      return await makeRequest('GET', `/connections/${args.connectionid}/certificates/${args.hash}`);
    }
  );

  server.tool(
    "get_team_membership_in_connection",
    "Retrieve Connection Membership",
    {
    teamid: z.string().describe("The unique identifier for the team within the account."),
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/teams/${args.teamid}/connections/${args.connectionid}`);
    }
  );

  server.tool(
    "connection_details",
    "Retrieve Connection Details",
    {
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/connections/${args.connectionid}`);
    }
  );

  server.tool(
    "list_all_connections_in_group",
    "List All Connections within a Group",
    {
    groupid: z.string().describe("The unique identifier for the group within the Fivetran system."),
    schema: z.string().describe("The name used both as the connection's name within the Fivetran system and as the source schema's name within your destination.").optional(),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.schema !== undefined) params['schema'] = args.schema;
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/groups/${args.groupid}/connections`, params);
    }
  );

  server.tool(
    "get_destination_certificate_details",
    "Retrieve Destination Certificate Details",
    {
    destinationid: z.string().describe("The unique identifier for the destination within the Fivetran system."),
    hash: z.string().describe("The unique identifier of the certificate (Base64URL encoded hash of the certificate).")
    },
    async (args) => {
      return await makeRequest('GET', `/destinations/${args.destinationid}/certificates/${args.hash}`);
    }
  );

  server.tool(
    "connection_schema_config",
    "Retrieve a Connection Schema Config",
    {
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/connections/${args.connectionid}/schemas`);
    }
  );

  server.tool(
    "get_destination_certificates_list",
    "List Certificates Approved for the Destination",
    {
    destinationid: z.string().describe("The unique identifier for the destination within the Fivetran system."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/destinations/${args.destinationid}/certificates`, params);
    }
  );

  server.tool(
    "list_connector_sdk_packages",
    "List All Connector SDK Packages",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/connector-sdk/packages`, params);
    }
  );

  server.tool(
    "list_all_connections",
    "List All Connections",
    {
    group_id: z.string().describe("Specify the group identifier to filter connections by group").optional(),
    schema: z.string().describe("Specify the schema name to filter connections by schema").optional(),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.group_id !== undefined) params['group_id'] = args.group_id;
      if (args.schema !== undefined) params['schema'] = args.schema;
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/connections`, params);
    }
  );

  server.tool(
    "list_all_webhooks",
    "List all Webhooks",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/webhooks`, params);
    }
  );

  server.tool(
    "group_ssh_public_key",
    "Retrieve Group Public SSH Key",
    {
    groupid: z.string().describe("The unique identifier for the group within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/groups/${args.groupid}/public-key`);
    }
  );

  server.tool(
    "transformation_package_metadata_details",
    "Retrieve a Quickstart Package Metadata Details",
    {
    package_definition_id: z.string().describe("The unique identifier for the Quickstart transformation package definition within the Fivetran system")
    },
    async (args) => {
      return await makeRequest('GET', `/transformations/package-metadata/${args.package_definition_id}`);
    }
  );

  server.tool(
    "get_proxy_agent_connections",
    "List All Connections Attached to the Proxy Agent",
    {
    agentid: z.string().describe("The unique identifier for the proxy agent within the Fivetran system."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/proxy/${args.agentid}/connections`, params);
    }
  );

  server.tool(
    "list_all_groups",
    "List All Destinations within Account",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/groups`, params);
    }
  );

  server.tool(
    "get_connection_fingerprint_details",
    "Retrieve Connection Fingerprint Details",
    {
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system."),
    hash: z.string().describe("The unique identifier of the fingerprint (Base64URL encoded hash of the fingerprint).")
    },
    async (args) => {
      return await makeRequest('GET', `/connections/${args.connectionid}/fingerprints/${args.hash}`);
    }
  );

  server.tool(
    "get_private_link_details",
    "Retrieve Private Link Details",
    {
    privatelinkid: z.string().describe("The unique identifier for the private link within the Fivetran system")
    },
    async (args) => {
      return await makeRequest('GET', `/private-links/${args.privatelinkid}`);
    }
  );

  server.tool(
    "get_system_keys",
    "List All System Keys",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/system-keys`, params);
    }
  );

  server.tool(
    "list_all_roles",
    "List all roles",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/roles`, params);
    }
  );

  server.tool(
    "metadata_public_connectors",
    "Retrieve Source Metadata Public Endpoint",
    {

    },
    async (args) => {
      return await makeRequest('GET', `/public/connector-types`);
    }
  );

  server.tool(
    "get_connection_certificates_list",
    "List Certificates Approved for the Connection",
    {
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/connections/${args.connectionid}/certificates`, params);
    }
  );

  server.tool(
    "list_destinations",
    "List All Destinations Within Account",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/destinations`, params);
    }
  );

  server.tool(
    "get_user_memberships_in_connections",
    "List All Connection Memberships",
    {
    userid: z.string().describe("The unique identifier for the user within the account."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/users/${args.userid}/connections`, params);
    }
  );

  server.tool(
    "get_destination_fingerprint_details",
    "Retrieve Destination Fingerprint Details",
    {
    destinationid: z.string().describe("The unique identifier for the destination within the Fivetran system."),
    hash: z.string().describe("The unique identifier of the fingerprint (Base64URL encoded hash of the fingerprint).")
    },
    async (args) => {
      return await makeRequest('GET', `/destinations/${args.destinationid}/fingerprints/${args.hash}`);
    }
  );

  server.tool(
    "get_system_key_details",
    "Retrieve System Key Details",
    {
    keyid: z.string().describe("The unique identifier for the system key within your Fivetran account.")
    },
    async (args) => {
      return await makeRequest('GET', `/system-keys/${args.keyid}`);
    }
  );

  server.tool(
    "get_log_service_details",
    "Retrieve Group Log Service Details",
    {
    logid: z.string().describe("The unique identifier for the log service within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/external-logging/${args.logid}`);
    }
  );

  server.tool(
    "list_all_transformation_projects",
    "List all Transformation Projects",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/transformation-projects`, params);
    }
  );

  server.tool(
    "get_user_in_team",
    "Retrieve User Membership in a Team",
    {
    teamid: z.string().describe("The unique identifier for the team within the account."),
    userid: z.string().describe("The unique identifier for the user within the account.")
    },
    async (args) => {
      return await makeRequest('GET', `/teams/${args.teamid}/users/${args.userid}`);
    }
  );

  server.tool(
    "team_details",
    "Retrieve Team Details",
    {
    teamid: z.string().describe("The unique identifier for the team within the account.")
    },
    async (args) => {
      return await makeRequest('GET', `/teams/${args.teamid}`);
    }
  );

  server.tool(
    "transformation_details",
    "Retrieve Transformation Details",
    {
    transformationid: z.string().describe("The unique identifier for the transformation within the Fivetran system")
    },
    async (args) => {
      return await makeRequest('GET', `/transformations/${args.transformationid}`);
    }
  );

  server.tool(
    "get_connector_sdk_package",
    "Retrieve Connector SDK Package Details",
    {
    package_id: z.string().describe("The unique identifier for the Connector SDK package.")
    },
    async (args) => {
      return await makeRequest('GET', `/connector-sdk/packages/${args.package_id}`);
    }
  );

  server.tool(
    "get_account_log_service_details",
    "Retrieve Account Log Service",
    {

    },
    async (args) => {
      return await makeRequest('GET', `/external-logging/account`);
    }
  );

  server.tool(
    "get_proxy_agent_details",
    "Retrieve Proxy Agent Details",
    {
    agentid: z.string().describe("The unique identifier for the proxy agent within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/proxy/${args.agentid}`);
    }
  );

  server.tool(
    "list_all_users_in_group",
    "List All Users within a Group",
    {
    groupid: z.string().describe("The unique identifier for the group within the Fivetran system."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional(),
    active: z.boolean().describe("Indicates whether to return only enabled users (true) or not (false). By default, both enabled (allowed to log in) and suspended users are returned.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      if (args.active !== undefined) params['active'] = args.active;
      return await makeRequest('GET', `/groups/${args.groupid}/users`, params);
    }
  );

  server.tool(
    "user_details",
    "Retrieve a User Details",
    {
    userid: z.string().describe("The unique identifier for the user within the account.")
    },
    async (args) => {
      return await makeRequest('GET', `/users/${args.userid}`);
    }
  );

  server.tool(
    "list_all_teams",
    "List All Teams",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/teams`, params);
    }
  );

  server.tool(
    "list_log_services",
    "List All Log Services within Account",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/external-logging`, params);
    }
  );

  server.tool(
    "connection_state",
    "Retrieve Connection State",
    {
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/connections/${args.connectionid}/state`);
    }
  );

  server.tool(
    "list_all_users",
    "List All Users",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional(),
    active: z.boolean().describe("Indicates whether to return only enabled users (true) or not (false). By default, both enabled (allowed to log in) and suspended users are returned.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      if (args.active !== undefined) params['active'] = args.active;
      return await makeRequest('GET', `/users`, params);
    }
  );

  server.tool(
    "download_connector_sdk_package",
    "Download Connector SDK Package",
    {
    package_id: z.string().describe("The unique identifier for the Connector SDK package.")
    },
    async (args) => {
      return await makeRequest('GET', `/connector-sdk/packages/${args.package_id}/download`);
    }
  );

  server.tool(
    "get_team_memberships_in_connections",
    "List All Connection Memberships",
    {
    teamid: z.string().describe("The unique identifier for the team within the account."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/teams/${args.teamid}/connections`, params);
    }
  );

  server.tool(
    "transformations_list",
    "List all Transformations",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional(),
    group_id: z.string().describe("Specify the group identifier to filter transformations by group").optional(),
    project_id: z.string().describe("Specify dbt Core project identifier to filter transformations by project").optional(),
    type: z.string().describe("Transformation type filter").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      if (args.group_id !== undefined) params['group_id'] = args.group_id;
      if (args.project_id !== undefined) params['project_id'] = args.project_id;
      if (args.type !== undefined) params['type'] = args.type;
      return await makeRequest('GET', `/transformations`, params);
    }
  );

  server.tool(
    "transformation_project_details",
    "Retrieve Transformation Project Details",
    {
    projectid: z.string().describe("The unique identifier for the transformation project within the Fivetran system")
    },
    async (args) => {
      return await makeRequest('GET', `/transformation-projects/${args.projectid}`);
    }
  );

  server.tool(
    "group_service_account",
    "Retrieve Group Service Account",
    {
    groupid: z.string().describe("The unique identifier for the group within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/groups/${args.groupid}/service-account`);
    }
  );

  server.tool(
    "webhook_details",
    "Retrieve Webhook Details",
    {
    webhookid: z.string().describe("The webhook ID")
    },
    async (args) => {
      return await makeRequest('GET', `/webhooks/${args.webhookid}`);
    }
  );

  server.tool(
    "get_user_membership_in_group",
    "Retrieve Group Membership Details",
    {
    userid: z.string().describe("The unique identifier for the user within the account."),
    groupid: z.string().describe("The unique identifier for the group within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/users/${args.userid}/groups/${args.groupid}`);
    }
  );

  server.tool(
    "get_hybrid_deployment_agent",
    "Returns Hybrid Deployment Agent Details",
    {
    agentid: z.string().describe("Hybrid Deployment Agent Id")
    },
    async (args) => {
      return await makeRequest('GET', `/hybrid-deployment-agents/${args.agentid}`);
    }
  );

  server.tool(
    "get_proxy_agent",
    "List all Proxy Agents",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/proxy`, params);
    }
  );

  server.tool(
    "get_private_links",
    "List All Private Links",
    {
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      return await makeRequest('GET', `/private-links`, params);
    }
  );

  server.tool(
    "list_users_in_team",
    "List All User Memberships",
    {
    teamid: z.string().describe("The unique identifier for the team within the account."),
    cursor: z.string().describe("Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination)").optional(),
    limit: z.number().describe("Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100.").optional(),
    active: z.boolean().describe("Indicates whether to return only enabled users (true) or not (false). By default, both enabled (allowed to log in) and suspended users are returned.").optional()
    },
    async (args) => {
      const params: Record<string, any> = {};
      if (args.cursor !== undefined) params['cursor'] = args.cursor;
      if (args.limit !== undefined) params['limit'] = args.limit;
      if (args.active !== undefined) params['active'] = args.active;
      return await makeRequest('GET', `/teams/${args.teamid}/users`, params);
    }
  );

  server.tool(
    "get_user_membership_in_connections",
    "Retrieve Connection Membership",
    {
    userid: z.string().describe("The unique identifier for the user within the account."),
    connectionid: z.string().describe("The unique identifier for the connection within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/users/${args.userid}/connections/${args.connectionid}`);
    }
  );

  server.tool(
    "destination_details",
    "Retrieve Destination Details",
    {
    destinationid: z.string().describe("The unique identifier for the destination within the Fivetran system.")
    },
    async (args) => {
      return await makeRequest('GET', `/destinations/${args.destinationid}`);
    }
  );

  server.tool(
    "metadata_connector_config",
    "Retrieve Connector Configuration Metadata",
    {
    service: z.string().describe("[The connector type](https://fivetran.com/docs/rest-api/getting-started#commonterms) identifier within the Fivetran system")
    },
    async (args) => {
      return await makeRequest('GET', `/metadata/connector-types/${args.service}`);
    }
  );

}
