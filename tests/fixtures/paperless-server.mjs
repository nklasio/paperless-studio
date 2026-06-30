import http from "node:http";

const port = Number(process.env.FIXTURE_PORT || 4010);
const taskId = "11111111-1111-4111-8111-111111111111";
let taskPolls = 0;
const correspondents = [{ id: 1, name: "Nordlicht GmbH" }];
const documentTypes = [{ id: 1, name: "Invoice" }];
const tags = [
  { id: 1, name: "Needs review" },
  { id: 2, name: "Finance" },
];
const customFields = [
  { id: 1, name: "Paid", data_type: "boolean", extra_data: null },
  { id: 2, name: "Reference", data_type: "string", extra_data: null },
  {
    id: 3,
    name: "Amount",
    data_type: "monetary",
    extra_data: { default_currency: "EUR" },
  },
  {
    id: 4,
    name: "Department",
    data_type: "select",
    extra_data: {
      select_options: [
        { id: "ops", label: "Operations" },
        { id: "finance", label: "Finance" },
      ],
    },
  },
];
let document = {
  id: 99,
  title: "Fixture invoice · June",
  correspondent: 1,
  document_type: 1,
  tags: [1, 2],
  created: "2026-06-24",
  added: "2026-06-28T09:00:00Z",
  page_count: 2,
  original_file_name: "fixture-invoice.pdf",
  user_can_change: true,
  custom_fields: [
    { field: 1, value: false },
    { field: 2, value: "INV-2026-06" },
  ],
};

function json(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "X-Version": "2.20.15",
    "X-Api-Version": "9",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

const collection = (results) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (request.headers.authorization !== "Token fixture-token") {
    return json(response, 401, { detail: "Invalid token" });
  }
  if (url.pathname === "/api/correspondents/")
    return json(response, 200, collection(correspondents));
  if (url.pathname === "/api/document_types/")
    return json(response, 200, collection(documentTypes));
  if (url.pathname === "/api/tags/" && request.method === "GET")
    return json(response, 200, collection(tags));
  if (url.pathname === "/api/custom_fields/")
    return json(response, 200, collection(customFields));
  if (url.pathname === "/api/documents/" && request.method === "GET")
    return json(response, 200, collection([document]));
  if (url.pathname === "/api/documents/99/" && request.method === "GET")
    return json(response, 200, document);
  if (url.pathname === "/api/documents/99/" && request.method === "PATCH") {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      const patch = JSON.parse(body);
      document = {
        ...document,
        ...patch,
        custom_fields: patch.custom_fields ?? document.custom_fields,
      };
      json(response, 200, document);
    });
    return;
  }
  if (
    url.pathname === "/api/documents/post_document/" &&
    request.method === "POST"
  ) {
    request.resume();
    taskPolls = 0;
    return json(response, 200, taskId);
  }
  if (url.pathname === "/api/tasks/") {
    taskPolls += 1;
    return json(
      response,
      200,
      collection([
        {
          task_id: taskId,
          task_file_name: "uploaded.pdf",
          status: taskPolls > 1 ? "SUCCESS" : "STARTED",
          result: taskPolls > 1 ? "100" : null,
          related_document: taskPolls > 1 ? "100" : null,
        },
      ]),
    );
  }
  if (url.pathname.endsWith("/preview/")) {
    response.writeHead(200, { "Content-Type": "application/pdf" });
    return response.end("%PDF-1.4\n%%EOF");
  }
  return json(response, 404, { detail: "Not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Paperless fixture listening on ${port}`);
});
