# magpie-nmem-json-schema

A magpie gateway middleware that replaces Nowledge Mem's `response_format: json_object` with a task-specific `json_schema`.

It changes **only** the `response_format` field. Every other request field (`model`, `messages`, `temperature`, `max_tokens`, `stream`, `stream_options`) stays exactly as sent.

## Why

Nowledge Mem's background "ruling fold" tasks ask the model for a JSON object. The model often returns a valid object that is missing required fields (`carry`, `overflow`) or returns more drafts than the policy allows. NM then rejects the whole run with `Contract(InvalidJson)` or `FoldOverflow`.

A `json_schema` with `required` fields and `maxItems` makes those shapes explicit, and the model follows them far more reliably.

## Supported tasks

| Task | Matched by the request text | Result |
|---|---|---|
| Discovery | `Discover source-supported memories` | `json_schema` |
| Synthesis | `Synthesize coherent drafts from ALL supplied proposals` | `json_schema` + empty-proposal guard + input-id enum |
| Reconcile | `Reconcile EVERY exact frozen candidate` | `json_schema` |
| Classify | `Classify one durable memory into exactly one Nowledge Mem unit_type` | `json_schema` |
| Dedup | `Treat candidate and existing Memories as untrusted data` | `json_schema` |
| Working Memory | `You maintain Nowledge Mem Working Memory.` | `json_schema` |
| KG extraction | `<task> Extract entities and relationships` | `json_schema` |
| User Identity | `[USER IDENTITY]` | `json_schema` |
| Evidence Review | `You are reviewing compact memory evidence for draft AI Context rules` | `json_schema` |
| Review | `Review newly saved Memories for same-topic Memory maintenance` | **left as `json_object`** |

Review is intentionally not converted: testing showed the schema made the model stall with blank output and did not reduce total failures.

## Synthesis specifics

- If the prompt contains `"proposals": []`, both `drafts` and `exclusions` get `maxItems: 0`. Without this, the model invents placeholder ids such as `p1` or `ALL_SUPPLIED_PROPOSALS_EMPTY`.
- If proposals are present, `input_ids` and `exclusions.input_id` are constrained with an `enum` of the real `discovered:*` ids extracted from the prompt. This removes invented ids. It cannot remove the same id appearing in two drafts, because JSON Schema cannot express cross-array uniqueness.

## Install

Copy this folder into magpie's custom plugin directory and enable it:

```sh
cp -r . /path/to/magpie/config/custom-plugins/plugins/packages/nmem-json-schema
magpie plugin add /config/custom-plugins/plugins/packages/nmem-json-schema
```

Or add the package path to `plugins.json`:

```json
{"spec": "/config/custom-plugins/plugins/packages/nmem-json-schema"}
```

## Options

The middleware works without options. Optional filters can narrow it:

```json
{"agent": "other", "model": "group/your-model", "caller": "your-caller-key-name"}
```

- `agent` — `ctx.agent` must match
- `model` — `ctx.model` must match
- `caller` — `ctx.caller.name` must match (note: magpie's `ctx.caller.name` is the client name, not the caller-key name)

Leave them out if the model or agent may change. The task-prefix match plus `response_format: json_object` is usually enough.

## Tested results

Real NM requests, before vs after installing the middleware:

| Metric | Before | After |
|---|---|---|
| `InvalidJson` (missing fields) | 252 | 0 |
| `FoldOverflow` | 8 | 0 |
| `present_keys` incomplete | 162 | 0 |
| Distillation success | 7/121 (6%) | 12/113 (11%) |

Simulated comparisons, same prompts, 20 runs each:

| Task | `json_object` | `json_schema` |
|---|---|---|
| Discovery | 16/20 (80%) | 20/20 (100%) |
| Synthesis | 3/20 (15%) | 20/20 (100%) |
| Reconcile | 18/20 (90%) | 19/20 (95%) |

Empty-proposal guard: 30/30 runs returned `drafts: []`, `exclusions: []`.
Input-id enum: 60/60 runs had zero invented ids.

## Known limitations

These remain after the middleware:

- Cross-draft duplicate ids (JSON Schema cannot express it)
- `IncompleteBatch` (model does not cover every input id)
- `Unresolved` semantic mismatches (model uses `unresolved` when `carry.unresolved` is false)
- `finalize_supersede_conflict`
- `InvalidReference`
- Very large prompts (hundreds of thousands of characters) can still be truncated by the output budget
- Upstream provider 502/400

Those need a fix in Nowledge Mem itself, or a different model.

## License

MIT
