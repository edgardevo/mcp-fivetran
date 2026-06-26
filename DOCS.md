# Tool catalogue

Auto-generated from the live tool registry. Do not edit by hand — run `npm run docs` to regenerate.

**Total tools:** 89

**Sections:**
- [Custom audit & operations](#custom-audit-operations) — 17 tools
- [Fivetran REST API (generated)](#fivetran-rest-api-generated) — 63 tools
- [Census Activations](#census-activations) — 9 tools

## Custom audit & operations

Hand-written audit, lineage, export, and operational tools. Source: `src/custom_tools.ts`.

_17 tools._

### `test_connection`

Tests the connection to the Fivetran API using the FIVETRAN_API_KEY and FIVETRAN_API_SECRET environment variables. Returns the account ID if successful.

**Parameters:** _none_

### `export_audit_report`

Generates a comprehensive audit report consisting of multiple CSV files (connections, users, teams, roles).

**Parameters:** _none_

### `get_next_page`

Fetches the next page of results for a Fivetran endpoint.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `endpoint` | string | The API endpoint (e.g., '/groups') |
| `cursor` | string | The cursor value for the next page |
| `limit` | number, optional, default=100 | Number of records to fetch |

### `export_fivetran_data`

Exports data from a Fivetran endpoint to a file (CSV or JSON). Automatically handles pagination.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `endpoint` | string | The API endpoint to export (e.g., '/users') |
| `limit` | number, optional, default=1000 | Safety limit on total pages |
| `format` | enum("csv" \| "json"), optional, default="csv" | The export format: 'csv' or 'json' |

### `get_connector_details`

Alias for connection_details. Retrieve detailed information about a specific connector.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connector_id` | string | The unique identifier for the connector. |

### `list_connectors`

Alias for list_all_connections. List all connectors in the Fivetran account.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `group_id` | string, optional | Filter by group ID |
| `cursor` | string, optional | Pagination cursor |
| `limit` | number, optional | Records per page |

### `get_connector_schema`

Alias for connection_schema_config. Retrieve the schema configuration for a connector.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connector_id` | string | The unique identifier for the connector. |

### `get_connector_columns`

Alias for connection_column_config. Retrieve column-level configuration for a specific table in a connector.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connector_id` | string | The unique identifier for the connector. |
| `schema` | string | The schema name. |
| `table` | string | The table name. |

### `get_account_health_summary`

Provides a high-level summary of the Fivetran account health, counting connectors by status and identifying critical failures.

**Parameters:** _none_

### `get_lineage_report`

Maps every connector to its destination, providing a full source-to-sink data flow report.

**Parameters:** _none_

### `analyze_connector_issues`

Performs a deep-dive into connectors with high failure rates or persistent setup issues.

**Parameters:** _none_

### `find_connector_by_table`

Searches connectors to find which one syncs a specific table. Makes one schema API call per active (non-paused) connector, scanning up to `limit` connectors (newest pages first). Returns all matches plus scan stats; if more active connectors exist than the limit, the result is flagged as truncated. Warning: can be slow on large accounts.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `table_name` | string | The name of the table to search for. |
| `limit` | number, optional, default=50 | Maximum number of active connectors to scan (default 50). Increase to cover larger accounts at the cost of more API calls. |

### `create_connector`

Creates a new connector in the Fivetran account.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `service` | string | The specific connector service (e.g. 'postgres', 'salesforce') |
| `group_id` | string | The destination group ID |
| `config` | any | A JSON object containing the connector-specific configuration |
| `run_setup_tests` | boolean, optional | Whether to run setup tests automatically |
| `paused` | boolean, optional | Whether to create the connector in a paused state |
| `sync_frequency` | number, optional | Sync frequency in minutes |

### `update_connector`

Updates an existing connector: pause/unpause, change sync frequency or schedule, or patch its configuration. Maps to PATCH /connections/{id}.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connector_id` | string | The unique identifier for the connector. |
| `paused` | boolean, optional | Pause (true) or unpause (false) the connector. |
| `sync_frequency` | number, optional | Sync frequency in minutes (e.g. 5, 15, 60, 360, 720, 1440). |
| `schedule_type` | string, optional | 'auto' for Fivetran-managed scheduling or 'manual'. |
| `daily_sync_time` | string, optional | Time of day for daily syncs (e.g. '14:00'), only when sync_frequency is 1440. |
| `run_setup_tests` | boolean, optional | Whether to run setup tests after applying the update. |
| `config` | any, optional | Partial connector-specific configuration to merge. |

### `sync_connector`

Forces a sync for a specific connector.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connector_id` | string | The unique identifier for the connector. |
| `force` | boolean, optional | If true, forces a sync even if one is already running. |

### `resync_connector`

Triggers a full historical resync of a connector or specific tables/schemas.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connector_id` | string | The unique identifier for the connector. |

### `run_connection_tests`

Re-runs the setup tests for a connector to diagnose connectivity/credential issues. Maps to POST /connections/{id}/test.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connector_id` | string | The unique identifier for the connector. |
| `trust_certificates` | boolean, optional | Trust the certificate presented by the source during the test. |
| `trust_fingerprints` | boolean, optional | Trust the SSH fingerprint presented by the source during the test. |

## Fivetran REST API (generated)

Read-only Fivetran tools auto-generated from `openapi.json`. Source: `src/generated_tools.ts` (do not edit by hand — regenerate with `npm run generate`).

_63 tools._

### `get_user_memberships_in_groups`

List All Group Memberships

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `userid` | string | The unique identifier for the user within the account. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `group_details`

Retrieve Group Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `groupid` | string | The unique identifier for the group within the Fivetran system. |

### `get_account_info`

Get Account Info from the API Key

**Parameters:** _none_

### `get_hybrid_deployment_agent_list`

List Hybrid Deployment Agents

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `groupid` | string, optional | The Fivetran Group Id. |
| `cursor` | string, optional | No description. |
| `limit` | number, optional | No description. |

### `get_team_memberships_in_groups`

List All Group Memberships

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `teamid` | string | The unique identifier for the team within the account. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `metadata_connectors`

Retrieve Source Metadata

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `get_team_membership_in_group`

Retrieve Group Membership Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `teamid` | string | The unique identifier for the team within the account. |
| `groupid` | string | The unique identifier for the group within the Fivetran system. |

### `get_connection_fingerprints_list`

List Fingerprints Approved for the Connection

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `transformation_package_metadata_list`

List All Quickstart Package Metadata

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `service` | string, optional | Specify the service identifier to filter Quickstart packages by connection service |
| `name` | string, optional | Specify the package name to filter Quickstart packages by name |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `connection_column_config`

Retrieve Source Table Columns Config

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |
| `schema` | string | The database schema name within your destination |
| `table` | string | The table name within your database schema |

### `get_destination_fingerprints_list`

List Fingerprints Approved for the Destination

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `destinationid` | string | The unique identifier for the destination within the Fivetran system. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `get_connection_certificate_details`

Retrieve Connection Certificate Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |
| `hash` | string | The unique identifier of the certificate (Base64URL encoded hash of the certificate). |

### `get_team_membership_in_connection`

Retrieve Connection Membership

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `teamid` | string | The unique identifier for the team within the account. |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |

### `connection_details`

Retrieve Connection Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |

### `list_all_connections_in_group`

List All Connections within a Group

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `groupid` | string | The unique identifier for the group within the Fivetran system. |
| `schema` | string, optional | The name used both as the connection's name within the Fivetran system and as the source schema's name within your destination. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `get_destination_certificate_details`

Retrieve Destination Certificate Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `destinationid` | string | The unique identifier for the destination within the Fivetran system. |
| `hash` | string | The unique identifier of the certificate (Base64URL encoded hash of the certificate). |

### `connection_schema_config`

Retrieve a Connection Schema Config

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |

### `get_destination_certificates_list`

List Certificates Approved for the Destination

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `destinationid` | string | The unique identifier for the destination within the Fivetran system. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `list_connector_sdk_packages`

List All Connector SDK Packages

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `list_all_connections`

List All Connections

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `group_id` | string, optional | Specify the group identifier to filter connections by group |
| `schema` | string, optional | Specify the schema name to filter connections by schema |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `list_all_webhooks`

List all Webhooks

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `group_ssh_public_key`

Retrieve Group Public SSH Key

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `groupid` | string | The unique identifier for the group within the Fivetran system. |

### `transformation_package_metadata_details`

Retrieve a Quickstart Package Metadata Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `package_definition_id` | string | The unique identifier for the Quickstart transformation package definition within the Fivetran system |

### `get_proxy_agent_connections`

List All Connections Attached to the Proxy Agent

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `agentid` | string | The unique identifier for the proxy agent within the Fivetran system. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `list_all_groups`

List All Destinations within Account

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `get_connection_fingerprint_details`

Retrieve Connection Fingerprint Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |
| `hash` | string | The unique identifier of the fingerprint (Base64URL encoded hash of the fingerprint). |

### `get_private_link_details`

Retrieve Private Link Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `privatelinkid` | string | The unique identifier for the private link within the Fivetran system |

### `get_system_keys`

List All System Keys

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `list_all_roles`

List all roles

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `metadata_public_connectors`

Retrieve Source Metadata Public Endpoint

**Parameters:** _none_

### `get_connection_certificates_list`

List Certificates Approved for the Connection

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `list_destinations`

List All Destinations Within Account

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `get_user_memberships_in_connections`

List All Connection Memberships

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `userid` | string | The unique identifier for the user within the account. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `get_destination_fingerprint_details`

Retrieve Destination Fingerprint Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `destinationid` | string | The unique identifier for the destination within the Fivetran system. |
| `hash` | string | The unique identifier of the fingerprint (Base64URL encoded hash of the fingerprint). |

### `get_system_key_details`

Retrieve System Key Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `keyid` | string | The unique identifier for the system key within your Fivetran account. |

### `get_log_service_details`

Retrieve Group Log Service Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `logid` | string | The unique identifier for the log service within the Fivetran system. |

### `list_all_transformation_projects`

List all Transformation Projects

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `get_user_in_team`

Retrieve User Membership in a Team

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `teamid` | string | The unique identifier for the team within the account. |
| `userid` | string | The unique identifier for the user within the account. |

### `team_details`

Retrieve Team Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `teamid` | string | The unique identifier for the team within the account. |

### `transformation_details`

Retrieve Transformation Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `transformationid` | string | The unique identifier for the transformation within the Fivetran system |

### `get_connector_sdk_package`

Retrieve Connector SDK Package Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `package_id` | string | The unique identifier for the Connector SDK package. |

### `get_account_log_service_details`

Retrieve Account Log Service

**Parameters:** _none_

### `get_proxy_agent_details`

Retrieve Proxy Agent Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `agentid` | string | The unique identifier for the proxy agent within the Fivetran system. |

### `list_all_users_in_group`

List All Users within a Group

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `groupid` | string | The unique identifier for the group within the Fivetran system. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |
| `active` | boolean, optional | Indicates whether to return only enabled users (true) or not (false). By default, both enabled (allowed to log in) and suspended users are returned. |

### `user_details`

Retrieve a User Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `userid` | string | The unique identifier for the user within the account. |

### `list_all_teams`

List All Teams

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `list_log_services`

List All Log Services within Account

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `connection_state`

Retrieve Connection State

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |

### `list_all_users`

List All Users

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |
| `active` | boolean, optional | Indicates whether to return only enabled users (true) or not (false). By default, both enabled (allowed to log in) and suspended users are returned. |

### `download_connector_sdk_package`

Download Connector SDK Package

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `package_id` | string | The unique identifier for the Connector SDK package. |

### `get_team_memberships_in_connections`

List All Connection Memberships

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `teamid` | string | The unique identifier for the team within the account. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `transformations_list`

List all Transformations

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |
| `group_id` | string, optional | Specify the group identifier to filter transformations by group |
| `project_id` | string, optional | Specify dbt Core project identifier to filter transformations by project |
| `type` | string, optional | Transformation type filter |

### `transformation_project_details`

Retrieve Transformation Project Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `projectid` | string | The unique identifier for the transformation project within the Fivetran system |

### `group_service_account`

Retrieve Group Service Account

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `groupid` | string | The unique identifier for the group within the Fivetran system. |

### `webhook_details`

Retrieve Webhook Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `webhookid` | string | The webhook ID |

### `get_user_membership_in_group`

Retrieve Group Membership Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `userid` | string | The unique identifier for the user within the account. |
| `groupid` | string | The unique identifier for the group within the Fivetran system. |

### `get_hybrid_deployment_agent`

Returns Hybrid Deployment Agent Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `agentid` | string | Hybrid Deployment Agent Id |

### `get_proxy_agent`

List all Proxy Agents

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `get_private_links`

List All Private Links

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |

### `list_users_in_team`

List All User Memberships

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `teamid` | string | The unique identifier for the team within the account. |
| `cursor` | string, optional | Paging cursor, [read more about pagination](https://fivetran.com/docs/rest-api/pagination) |
| `limit` | number, optional | Number of records to fetch per page. Accepts a number in the range 1..1000; the default value is 100. |
| `active` | boolean, optional | Indicates whether to return only enabled users (true) or not (false). By default, both enabled (allowed to log in) and suspended users are returned. |

### `get_user_membership_in_connections`

Retrieve Connection Membership

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `userid` | string | The unique identifier for the user within the account. |
| `connectionid` | string | The unique identifier for the connection within the Fivetran system. |

### `destination_details`

Retrieve Destination Details

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `destinationid` | string | The unique identifier for the destination within the Fivetran system. |

### `metadata_connector_config`

Retrieve Connector Configuration Metadata

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `service` | string | [The connector type](https://fivetran.com/docs/rest-api/getting-started#commonterms) identifier within the Fivetran system |

## Census Activations

Tools that wrap the Census (Activations) reverse-ELT API. Source: `src/census_tools.ts`.

_9 tools._

### `activations_list_workspaces`

Returns a list of Census workspaces in the organization.

**Parameters:** _none_

### `activations_get_workspace`

Returns details for a specific Census workspace.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `workspace_id` | string | The unique identifier for the workspace. |

### `activations_list_users`

Returns a list of users in the Census organization.

**Parameters:** _none_

### `activations_list_syncs`

Returns a list of syncs in the Census workspace.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `page` | number, optional | The page number to retrieve. |
| `per_page` | number, optional | The number of items per page. |

### `activations_get_sync`

Returns details for a specific Census sync.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `sync_id` | string | The unique identifier for the sync. |

### `activations_list_sync_runs`

Returns a list of sync runs in the Census workspace.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `sync_id` | string, optional | Filter by sync ID. |
| `page` | number, optional | The page number to retrieve. |
| `per_page` | number, optional | The number of items per page. |

### `activations_get_sync_run`

Returns details for a specific Census sync run.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `sync_run_id` | string | The unique identifier for the sync run. |

### `activations_list_sources`

Returns a list of sources in the Census workspace.

**Parameters:** _none_

### `activations_list_destinations`

Returns a list of destinations in the Census workspace.

**Parameters:** _none_
