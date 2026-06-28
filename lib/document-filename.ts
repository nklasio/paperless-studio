const reservedFilenameCharacters = new Set([
  "/",
  "\\",
  ":",
  "*",
  "?",
  '"',
  "<",
  ">",
  "|",
]);

export function documentPdfFilename(title: string, documentId: string) {
  const safeTitle = Array.from(title.normalize("NFKC"), (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 ||
      codePoint === 127 ||
      reservedFilenameCharacters.has(character)
      ? " "
      : character;
  })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.pdf$/i, "")
    .trim();
  const stem =
    Array.from(safeTitle).slice(0, 140).join("") || `document-${documentId}`;
  return `${stem}.pdf`;
}

export function inlinePdfDisposition(filename: string) {
  const wellFormedFilename = filename.toWellFormed();
  const asciiFallback = Array.from(wellFormedFilename, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint >= 32 &&
      codePoint <= 126 &&
      !['"', "\\"].includes(character)
      ? character
      : "_";
  }).join("");
  const encodedFilename = encodeURIComponent(wellFormedFilename).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`;
}
