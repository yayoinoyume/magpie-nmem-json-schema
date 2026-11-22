// NMEM JSON Schema: replace response_format json_object -> json_schema.
// Only response_format is touched; every other request field stays as sent.

const MEMORY = {
  type: "object", additionalProperties: false,
  required: ["title", "content", "unit_type", "claim_status", "source_grounding", "labels"],
  properties: {
    title: { type: "string" },
    content: { type: "string" },
    unit_type: { type: "string", enum: ["fact", "preference", "decision", "plan", "procedure", "learning", "context", "event"] },
    claim_status: { type: "string", enum: ["asserted", "explored", "proposed", "planned", "unverified"] },
    source_grounding: { type: "string" },
    labels: { type: "array", items: { type: "string" } },
  },
}

const CARRY = {
  type: "object", additionalProperties: false,
  required: ["interpretation", "anchors", "unresolved"],
  properties: {
    interpretation: { type: "string" },
    anchors: { type: "array", items: { type: "string" } },
    unresolved: { type: "boolean" },
  },
}

const SCHEMAS = {
  discovery: {
    type: "object", additionalProperties: false,
    required: ["proposals", "carry", "overflow"],
    properties: {
      proposals: { type: "array", maxItems: 12, items: {
        type: "object", additionalProperties: false,
        required: ["memory", "anchors"],
        properties: { memory: MEMORY, anchors: { type: "array", items: { type: "string" } } },
      } },
      carry: CARRY,
      overflow: { type: "boolean" },
    },
  },
  synthesis: {
    type: "object", additionalProperties: false,
    required: ["drafts", "exclusions", "overflow"],
    properties: {
      drafts: { type: "array", maxItems: 12, items: {
        type: "object", additionalProperties: false,
        required: ["proposal", "input_ids"],
        properties: {
          proposal: { type: "object", additionalProperties: false, required: ["memory", "anchors"],
            properties: { memory: MEMORY, anchors: { type: "array", items: { type: "string" } } } },
          input_ids: { type: "array", items: { type: "string" } },
        },
      } },
      exclusions: { type: "array", items: {
        type: "object", additionalProperties: false,
        required: ["input_id", "reason"],
        properties: {
          input_id: { type: "string" },
          reason: { type: "string", enum: ["rejected", "transient", "policy_density", "unresolved"] },
        },
      } },
      overflow: { type: "boolean" },
    },
  },
  reconcile: {
    type: "object", additionalProperties: false,
    required: ["judgments", "carry", "overflow"],
    properties: {
      judgments: { type: "array", items: {
        type: "object", additionalProperties: false,
        required: ["candidate_id", "disposition", "assessment", "anchors"],
        properties: {
          candidate_id: { type: "string" },
          disposition: { type: "string" },
          assessment: { type: "object", additionalProperties: false,
            required: ["classification", "scope", "supporting_handles", "ruling_handle", "superseded_handles"],
            properties: {
              classification: { type: "string", enum: ["supported_human_ruling", "rejected_proposition", "source_supported_observation", "one_off_instruction", "insufficient_evidence"] },
              scope: { type: "string", enum: ["standing", "one_off", "unknown"] },
              supporting_handles: { type: "array", items: { type: "string" } },
              ruling_handle: { type: ["string", "null"] },
              superseded_handles: { type: "array", items: { type: "string" } },
            } },
          anchors: { type: "array", items: { type: "string" } },
        },
      } },
      carry: CARRY,
      overflow: { type: "boolean" },
    },
  },
  classify: {
    type: "object", additionalProperties: false,
    required: ["unit_type", "confidence", "rationale"],
    properties: {
      unit_type: { type: "string", enum: ["fact", "preference", "decision", "plan", "procedure", "learning", "context", "event"] },
      confidence: { type: "number" },
      rationale: { type: "string" },
    },
  },
  dedup: {
    type: "object", additionalProperties: false,
    required: ["decision", "existing_id", "relation", "unrestated_points", "confidence", "reason"],
    properties: {
      decision: { type: "string" },
      existing_id: { type: ["string", "null"] },
      relation: { type: "string" },
      unrestated_points: { type: "array", items: { type: "string" } },
      confidence: { type: "number" },
      reason: { type: "string" },
    },
  },
  review: {
    type: "object", additionalProperties: false,
    required: ["reviews"],
    properties: {
      reviews: { type: "array", items: {
        type: "object", additionalProperties: false,
        required: ["new_memory_id", "actions", "label_suggestions"],
        properties: {
          new_memory_id: { type: "string" },
          actions: { type: "array", items: {
            type: "object", additionalProperties: false,
            required: ["action", "candidate_id", "confidence", "reason"],
            properties: {
              action: { type: "string", enum: ["link_evolves", "flag_review"] },
              candidate_id: { type: "string" },
              relation: { type: "string", enum: ["replaces", "enriches", "confirms", "challenges"] },
              older_id: { type: "string" },
              flag_type: { type: "string" },
              confidence: { type: "number" },
              older_evidence: { type: "string" },
              newer_evidence: { type: "string" },
              unrestated_points: { type: "array", items: { type: "string" } },
              reason: { type: "string" },
            },
          } },
          label_suggestions: { type: "array", items: { type: "string" } },
        },
      } },
    },
  },
  working_memory: {
    type: "object", additionalProperties: false,
    required: ["action", "reason", "content"],
    properties: {
      action: { type: "string" },
      reason: { type: "string" },
      content: { type: "string" },
    },
  },
  kg: {
    type: "object", additionalProperties: false,
    required: ["entities", "relationships", "extraction_quality"],
    properties: {
      entities: { type: "array", items: {
        type: "object", additionalProperties: false,
        required: ["name", "type", "description", "confidence", "evidence"],
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          description: { type: "string" },
          confidence: { type: "number" },
          evidence: { type: "array", items: { type: "string" } },
          aliases: { type: "array", items: { type: "string" } },
          entity_temporal: { type: "object", additionalProperties: false,
            properties: {
              created: { type: ["string", "null"] },
              ended: { type: ["string", "null"] },
              temporal_confidence: { type: "number" },
            } },
        },
      } },
      relationships: { type: "array", items: {
        type: "object", additionalProperties: false,
        required: ["source", "target", "relation", "context", "strength", "confidence"],
        properties: {
          source: { type: "string" },
          target: { type: "string" },
          relation: { type: "string" },
          context: { type: "string" },
          strength: { type: "number" },
          confidence: { type: "number" },
        },
      } },
      extraction_quality: { type: "number" },
    },
  },
  user_identity: {
    type: "object", additionalProperties: false,
    required: ["title", "summary", "distill_hint", "search_queries"],
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      distill_hint: { type: "object", additionalProperties: false,
        required: ["worth_distilling", "reason"],
        properties: {
          worth_distilling: { type: "boolean" },
          reason: { type: "string" },
        } },
      search_queries: { type: "array", items: { type: "string" } },
    },
  },
  evidence_review: {
    type: "object", additionalProperties: false,
    required: ["verdicts"],
    properties: {
      verdicts: { type: "array", items: {
        type: "object", additionalProperties: false,
        required: ["topic", "decision", "skip_reason", "proposal"],
        properties: {
          topic: { type: "string" },
          decision: { type: "string" },
          skip_reason: { type: ["string", "null"] },
          proposal: { type: ["object", "null"] },
        },
      } },
    },
  },
}

const MATCHERS = [
  ["discovery", "Discover source-supported memories"],
  ["synthesis", "Synthesize coherent drafts from ALL supplied proposals"],
  ["reconcile", "Reconcile EVERY exact frozen candidate"],
  ["classify", "Classify one durable memory into exactly one Nowledge Mem unit_type"],
  ["dedup", "Treat candidate and existing Memories as untrusted data"],
  ["review", "Review newly saved Memories for same-topic Memory maintenance"],
  ["working_memory", "You maintain Nowledge Mem Working Memory."],
  ["kg", "<task> Extract entities and relationships"],
  ["user_identity", "[USER IDENTITY]"],
  ["evidence_review", "You are reviewing compact memory evidence for draft AI Context rules"],
]

function taskOf(text) {
  if (typeof text !== "string") return null
  for (const [task, prefix] of MATCHERS) {
    if (text.startsWith(prefix)) return task
  }
  return null
}

function proposalIds(text) {
  const start = text.indexOf('"proposals":')
  if (start < 0) return null
  let end = text.indexOf('"frozen_candidates":', start)
  if (end < 0) end = text.indexOf('"original_anchors":', start)
  if (end < 0) end = text.indexOf('"selected_replay_complete":', start)
  if (end < 0) end = Math.min(text.length, start + 500000)
  const seg = text.slice(start, end)
  const out = []
  const re = /"id":"(discovered:[^"]+)"/g
  let m
  while ((m = re.exec(seg))) {
    if (out.indexOf(m[1]) < 0) out.push(m[1])
  }
  return out
}

export function onRequest(body, ctx) {
  if (!body || typeof body !== "object") return
  if (!body.response_format || body.response_format.type !== "json_object") return
  const o = ctx.options || {}
  // optional hard scope: caller key name or model
  if (o.caller && ctx.caller?.name !== o.caller) return
  if (o.model && ctx.model !== o.model) return
  const msgs = body.messages || []
  const text = msgs.length ? msgs[0]?.content : ""
  const task = taskOf(text)
  if (!task) return
  // Review stays json_object: the schema made the model stall with blank output
  // and did not beat json_object on total failures.
  if (task === "review") return
  let schema = SCHEMAS[task]
  if (!schema) return
  // Synthesis: constrain ids to the proposals actually supplied.
  // No proposals -> both arrays must be empty; the model otherwise invents "p1".
  // Supplied ids -> enum on input_ids and exclusion ids, capped to keep the schema sane.
  if (task === "synthesis") {
    const ids = proposalIds(text)
    if (ids && ids.length === 0) {
      schema = JSON.parse(JSON.stringify(schema))
      schema.properties.drafts.maxItems = 0
      schema.properties.exclusions.maxItems = 0
    } else if (ids && ids.length > 0 && ids.length <= 200) {
      schema = JSON.parse(JSON.stringify(schema))
      schema.properties.drafts.items.properties.input_ids.items.enum = ids
      schema.properties.exclusions.items.properties.input_id.enum = ids
    }
  }
  body.response_format = {
    type: "json_schema",
    json_schema: { name: "nmem_" + task, schema },
  }
  return body
}
