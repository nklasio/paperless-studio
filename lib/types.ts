export type DocumentStatus = "review" | "ready";

export type PaperlessDocument = {
  id: number;
  title: string;
  correspondent: string;
  documentType: string;
  tags: string[];
  created: string;
  added: string;
  pages: number;
  size: string;
  status: DocumentStatus;
  note?: string;
  accent: "blue" | "ochre" | "sage" | "plum" | "slate";
};

export type NavView =
  | "inbox"
  | "recent"
  | "review"
  | "all"
  | "finance"
  | "personal"
  | "work";
