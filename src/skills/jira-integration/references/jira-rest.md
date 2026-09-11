# Jira Cloud REST v3 - the calls this workflow needs

All examples assume:

```bash
AUTH="$JIRA_EMAIL:$JIRA_API_TOKEN"
SITE="https://your-org.atlassian.net"
PROJ="PROJ"
```

Base path: `$SITE/rest/api/3`. Authentication: HTTP Basic with email and API token (Jira Cloud; Data Center differs - check your instance's version before using any of this).

## Discovery (run once per project, record the results)

```bash
# Project metadata, including issue types
curl -s -u "$AUTH" "$SITE/rest/api/3/project/$PROJ"

# All fields, to resolve custom field ids by name
curl -s -u "$AUTH" "$SITE/rest/api/3/field"

# What is required to create each issue type
curl -s -u "$AUTH" -G "$SITE/rest/api/3/issue/createmeta" \
  --data-urlencode "projectKeys=$PROJ" \
  --data-urlencode "expand=projects.issuetypes.fields"

# Statuses configured for the project
curl -s -u "$AUTH" "$SITE/rest/api/3/project/$PROJ/statuses"
```

## Search (JQL)

```bash
curl -s -u "$AUTH" -G "$SITE/rest/api/3/search" \
  --data-urlencode "jql=project=$PROJ AND statusCategory != Done ORDER BY priority DESC, created ASC" \
  --data-urlencode "fields=summary,status,priority,issuetype,assignee" \
  --data-urlencode "maxResults=25"
```

JQL cookbook:

| Need | JQL |
| --- | --- |
| My open work | `project=PROJ AND assignee=currentUser() AND statusCategory!=Done` |
| Ready to pick up | `project=PROJ AND status="Ready" AND assignee IS EMPTY ORDER BY priority DESC` |
| In review | `project=PROJ AND status="In Review"` |
| Blocked | `project=PROJ AND status="Blocked"` |
| Changed this week | `project=PROJ AND updated >= -7d ORDER BY updated DESC` |
| Closed this week (for a report) | `project=PROJ AND statusCategory=Done AND resolutiondate >= -7d` |
| One epic's children | `parent=PROJ-100` |
| Mentioning a branch id | `project=PROJ AND text ~ "TASK-42"` |

Pagination: `startAt` + `maxResults`; keep going while `startAt + maxResults < total`. Never fetch an unbounded result set into a session.

## Read an issue

```bash
curl -s -u "$AUTH" "$SITE/rest/api/3/issue/PROJ-412?fields=summary,description,status,priority,assignee,labels,parent"
```

Descriptions come back as ADF. Render them to text for reading; do not round-trip them through a naive string edit.

## Create

```bash
curl -s -u "$AUTH" -X POST "$SITE/rest/api/3/issue" \
  -H 'Content-Type: application/json' \
  -d '{
    "fields": {
      "project": { "key": "PROJ" },
      "issuetype": { "name": "Story" },
      "summary": "Add saved searches",
      "description": {
        "type": "doc", "version": 1,
        "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "See docs/specs/SPEC-412-saved-searches.md" }] }]
      },
      "labels": ["sdlc-kit"]
    }
  }'
```

## Transition

```bash
# 1. what is legal from here
curl -s -u "$AUTH" "$SITE/rest/api/3/issue/PROJ-412/transitions"

# 2. perform it, by id
curl -s -u "$AUTH" -X POST "$SITE/rest/api/3/issue/PROJ-412/transitions" \
  -H 'Content-Type: application/json' \
  -d '{ "transition": { "id": "31" } }'
```

Transitions are workflow-specific and position-dependent: the set available from `To Do` is not the set available from `In Progress`. Always read before writing.

## Comment

```bash
curl -s -u "$AUTH" -X POST "$SITE/rest/api/3/issue/PROJ-412/comment" \
  -H 'Content-Type: application/json' \
  -d '{
    "body": { "type": "doc", "version": 1, "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "PR opened: " },
        { "type": "text", "text": "#123", "marks": [{ "type": "link", "attrs": { "href": "https://github.com/org/repo/pull/123" } }] }] }
    ] }
  }'
```

## Assign

```bash
curl -s -u "$AUTH" -X PUT "$SITE/rest/api/3/issue/PROJ-412/assignee" \
  -H 'Content-Type: application/json' -d '{ "accountId": "5b10ac8d82e05b22cc7d4ef5" }'
```

Find an `accountId` with `GET /rest/api/3/user/search?query=name@example.com`. Never guess one.

## Link issues

```bash
curl -s -u "$AUTH" -X POST "$SITE/rest/api/3/issueLink" \
  -H 'Content-Type: application/json' \
  -d '{ "type": { "name": "Blocks" }, "inwardIssue": { "key": "PROJ-500" }, "outwardIssue": { "key": "PROJ-412" } }'
```

## Rate limits and etiquette

- Jira Cloud rate-limits per user; back off on `429` using `Retry-After`.
- Prefer one `search` with the right JQL over N `issue` reads.
- Every write notifies humans. Batch nothing; confirm everything.

## Minimal ADF

```json
{ "type": "doc", "version": 1, "content": [
  { "type": "paragraph", "content": [ { "type": "text", "text": "plain sentence" } ] },
  { "type": "bulletList", "content": [
    { "type": "listItem", "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": "item" } ] } ] }
  ] },
  { "type": "codeBlock", "attrs": { "language": "bash" }, "content": [ { "type": "text", "text": "go test ./..." } ] }
] }
```
