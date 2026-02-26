/**
 * Fivetran Query Builder Utility
 *
 * Provides foundational helpers for safely constructing API queries.
 */

export interface FivetranQueryOptions {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * Builds a safe query string for Fivetran API endpoints.
 * Ensures parameters are sanitized and conform to expected types.
 */
export function buildFivetranQuery(options: FivetranQueryOptions = {}): string {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    if (options.limit < 1 || options.limit > 1000) {
      throw new Error(`Invalid limit: ${options.limit}. Must be between 1 and 1000.`);
    }
    params.append('limit', options.limit.toString());
  }

  if (options.cursor) {
    // Basic sanitization: check for alphanumeric or standard cursor formats
    if (!/^[a-zA-Z0-9._-]+$/.test(options.cursor)) {
      throw new Error('Invalid cursor format detected.');
    }
    params.append('cursor', options.cursor);
  }

  if (options.sortBy) {
    // Only allow safe alphanumeric field names
    if (!/^[a-z_]+$/.test(options.sortBy)) {
      throw new Error('Invalid sortBy field name.');
    }
    params.append('sort_by', options.sortBy);
  }

  if (options.order) {
    params.append('order', options.order);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Specifically for connector status filtering if supported in the future.
 */
export function buildConnectorFilter(status: string): string {
  const allowedStatuses = ['paused', 'syncing', 'scheduled', 'broken'];
  if (!allowedStatuses.includes(status.toLowerCase())) {
    throw new Error(`Invalid connector status: ${status}`);
  }
  return `?status=${status.toLowerCase()}`;
}
