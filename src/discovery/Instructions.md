### Analyzing repositories to generate system map entries

The system map can be continuously updated as your architecture evolves.

Below is a guide on how to analyze a repository to automatically generate a new entry for the system map JSON.

1. Open your preferred IDE or text editor.
2. Open the Git repository you want to analyze in your editor.
3. From the root of the repository, run the following recommended prompt:

```markdown
You are an advanced code analysis agent. Your task is to recursively scan the current repository and to extract structured metadata.

# Output JSON Schema

We expect to output a single JSON entry matching the following schema.

"""
{
"id": "svc-sales-order",
"name": "sales_order",
"size": "large",
"language": "python",
"context": "order-management",
"repoUrl": "https://gitlab.com/...",
"description": "Short human-readable purpose of the microservice",
"docLinks": [],
"use_cases": [],
"endpointsCalled": [],
"endpoints": [],
"eventsPublished": [],
"eventsConsumed": []
}
"""

# Output JSON Schema Example

Below is an example for a service called `sales_order`:
"""
{
"id": "svc-sales-order",
"name": "sales_order",
"size": "large",
"language": "python",
"context": "order-management",
"repoUrl": "https://github.com/your-org/order-management/tree/main/services/sales_order",
"description": "Source of truth for orders. Handles order creation, modifications, status updates, and historical imports.",
"docLinks": [
"https://docs.example.com/api/configuration/order-management/sales_order_config",
"https://docs.example.com/api/integration/order-management/sales_order_api"
],
"use_cases": ["order_capture", "order_modification", "order_history", "grace_period", "update_order"],
"endpoints": [
"POST /v0/customer_profile_amendment",
"POST /notifications",
"POST /orders",
"PATCH /orders/{id}/status",
"GET /v0/orders",
"GET /v0/orders/{id}",
"POST /v0/orders/{id}/prices",
"GET /v0/config/sales_order/external_order_webhook",
"GRPC: AddSalesOrderItemsJson",
"GRPC: GetSalesOrderByUuidJson",
"GRPC: GetSalesOrderPrices",
"RPC: patch_sales_order",
"RPC: approve_big_order",
"RPC: get_delivery_options_for_order_in_grace_period",
"GET /health",
"GET /metrics"
],
"endpointsCalled": [svc-logistic-order GET /routes],
"eventsPublished": [
"sales_order.on_hold",
"sales_order.open"
],
"eventsConsumed": [
"logistic_order.cancelled",
"logistic_order.conflict"
]
}
"""

# Requirements

Here are the detailed requirements per field:

- id: kebab-case name prefixed with `svc-`
- name: the microservice folder or main module name (snake_case)
- size: estimate as `small`, `medium`, or `large` based on number of files/functions and overall complexity
- language: primary language used (likely python or golang)
- context: derive from directory structure or repo naming (for now default to `catalog`)
- repoUrl: try to extract from any Git remote, .git/config, or doc reference if present
- description: summarize the core service purpose using README, doc strings, or comments
- docLinks: extract links found in README.md, markdowns, or comments (especially to internal docs)
- use_cases: summarize core capabilities (based on method names, README, usage context)
- endpoints: list all HTTP, GRPC, or RPC routes this service exposes in `HTTP_VERB /some/path` format (see example above for format)
- endpointsCalled: list all endpoints this service calls externally (search for requests, httpx, fetch, grpc.Dial, rpc.call, etc.) in `svc-calee-id HTTP_VERB /some/path` format (see example above for format)
- eventsPublished: match RabbitMQ or "Phavda" .publish(), emit, send_event, etc. (e.g. `sales_order.on_hold`). See example above for format
- eventsConsumed: match RabbitMQ/Phavda consumers: .on, subscribe, register_handler, etc. (e.g. `sales_order.on_hold`). See example above for format

# Instructions:

1. Start from the root directory of the repository
2. As you go along, inspect:

- README.md, .proto files, main.py, main.go, /handlers, /routes, /rpc, /grpc, /eventing, /queue, etc.
- Code annotations, docstrings, known entrypoints.
- Take note of files related to routing, eventing, queueing, etc.

3. If you are not sure about a field, leave it empty.
4. Only return the final JSON result — no extra commentary.
```
