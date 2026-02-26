const https = require('https');
const fs = require('fs');

const API_KEY = process.env.FIVETRAN_API_KEY;
const API_SECRET = process.env.FIVETRAN_API_SECRET;

if (!API_KEY || !API_SECRET) {
    console.error('Error: FIVETRAN_API_KEY and FIVETRAN_API_SECRET environment variables are required.');
    process.exit(1);
}

const headers = {
    'Authorization': 'Basic ' + Buffer.from(API_KEY + ':' + API_SECRET).toString('base64'),
    'Content-Type': 'application/json'
};

async function fetchAll(endpoint) {
    let results = [];
    let nextCursor = null;

    do {
        const url = `https://api.fivetran.com/v1${endpoint}${nextCursor ? '?cursor=' + nextCursor : ''}`;
        const data = await new Promise((resolve, reject) => {
            https.get(url, { headers }, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        reject(new Error(`API Error ${res.statusCode}: ${body}`));
                    } else {
                        try {
                            resolve(JSON.parse(body));
                        } catch (e) {
                            reject(e);
                        }
                    }
                });
            }).on('error', reject);
        });

        if (data.data && Array.isArray(data.data.items)) {
             results = results.concat(data.data.items);
             nextCursor = data.data.next_cursor;
        } else if (data.data && Array.isArray(data.data)) { // handle non-paginated or different structure if any
             results = results.concat(data.data);
             nextCursor = null; // assume no pagination for simple lists unless cursor present
             if (data.next_cursor) nextCursor = data.next_cursor;
        } else {
            nextCursor = null;
        }

    } while (nextCursor);

    return results;
}

async function main() {
    try {
        console.error('Fetching Groups...');
        const groups = await fetchAll('/groups');
        const groupsMap = new Map(groups.map(g => [g.id, g]));

        console.error('Fetching Destinations...');
        const destinations = await fetchAll('/destinations');
        const bqDestinationIds = new Set(
            destinations.filter(d => ['big_query', 'managed_big_query'].includes(d.service)).map(d => d.id)
        );

        console.error('Fetching Connectors...');
        const connectors = await fetchAll('/connectors');

        const spreadsheetServices = ['google_sheets', 'microsoft_excel_online', 'ftp', 'email', 's3', 'google_drive', 'gcs', 'azure_blob_storage', 'sftp'];

        const relevantConnectors = connectors.filter(c => {
            const isSpreadsheet = spreadsheetServices.includes(c.service);
            const isBigQuery = bqDestinationIds.has(c.group_id);
            return isSpreadsheet && isBigQuery;
        });

        if (relevantConnectors.length === 0) {
            console.error('No matching connectors found. Debugging info:');
            console.error('Unique Connector Services:', [...new Set(connectors.map(c => c.service))]);
            console.error('Destination Services:', [...new Set(destinations.map(d => d.service))]);
        }

        const csvHeaders = [
            'ID',
            'Name',
            'Service',
            'Group ID',
            'Group Name',
            'Destination Service',
            'Destination Region',
            'Created At',
            'Succeeded At',
            'Failed At',
            'Sync Frequency',
            'Schedule Type',
            'Paused',
            'Setup State',
            'Sync State'
        ].join(',');

        const csvRows = relevantConnectors.map(c => {
             const group = groupsMap.get(c.group_id);
             const destination = destinations.find(d => d.id === c.group_id);
             return [
                 `"${c.id}"`,
                 `"${c.schema}"`,
                 `"${c.service}"`,
                 `"${c.group_id}"`,
                 `"${group ? group.name : 'Unknown'}"`,
                 `"${destination ? destination.service : 'Unknown'}"`,
                 `"${destination ? destination.region : 'Unknown'}"`,
                 `"${c.created_at}"`,
                 `"${c.succeeded_at || ''}"`,
                 `"${c.failed_at || ''}"`,
                 c.sync_frequency,
                 `"${c.schedule_type}"`,
                 c.paused,
                 `"${c.status.setup_state}"`,
                 `"${c.status.sync_state}"`
             ].join(',');
        });

        console.log([csvHeaders, ...csvRows].join('\n'));

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
