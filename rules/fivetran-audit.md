# Fivetran Audit Rules

When performing a Fivetran audit, you MUST follow these rules:

1. **Verify Connection Health**: Always check `setup_tests` in connector details. If any test is not `Succeeded`, mark the connector as "Broken".
2. **Flag High Frequency**: Any connector with a `sync_frequency` less than 60 minutes should be noted as "High Frequency" (potential API quota or cost concern).
3. **Analyze Roles**: Flag any user with the role `Account Administrator` or `Destination Administrator`. Verify if this level of access is justified.
4. **Data Privacy**: Never attempt to bypass redaction. If a field is `[REDACTED]`, explain that this is a security measure and do not guess the value.
5. **Pagination**: If a list result is truncated (indicated by a `next_cursor`), explicitly ask the user if they want to see more or use `get_next_page`.
