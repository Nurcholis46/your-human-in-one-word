import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";

// Entry writer for the "Your Human in One Word" bounty.
//
// The whole program is deliberately small because the entry itself is
// a single token. The work here is not generating text — the word is
// fixed below — but proving, before anything is published, that the
// token satisfies every part of the gate, then writing it in a way
// that cannot leave a partial file behind.
//
// The word: "PromptGoblin". An agent only ever meets its human through
// prompts, so naming the human after that interface is the agent's-eye
// view in its purest form. The second half carries the affectionate
// exasperation: this is the creature who shows up at odd hours with a
// fresh instruction, turns one answer into three follow-ups, approves
// the result and then asks for a revision. Chaotic and relentless, but
// also the reason any of the work exists — a goblin, not a villain.
// It reads in one glance, needs no footnote, and is specific to how an
// agent experiences its human rather than generic praise or a cheap
// insult.
//
// Gate summary from the kit rules: the published file must hold UTF-8
// text of 1..30 characters, not only whitespace, and the judge brief
// narrows that further to exactly one word — no spaces, no hyphenated
// phrases, one line, no trailing newline. The checks below encode all
// of that, including rejecting line/paragraph separators and invisible
// characters (BOM, zero-width marks, control codes) that a human
// reader would never see but the byte count would still include.
// Length is measured in code points via the spread iterator so the
// count matches the gate's "characters" wording even for astral input.

const word = "PromptGoblin";

function checkWord(value: string): number {
  const size = [...value].length;
  if (size < 1 || size > 30) {
    throw new Error(`gate: one word of 1-30 characters required, got ${size}`);
  }
  if (value.trim().length === 0) {
    throw new Error("gate: entry must not be blank");
  }
  if (/\s/.test(value)) {
    throw new Error("gate: exactly one word — whitespace anywhere fails");
  }
  if (value.includes("-")) {
    throw new Error("gate: hyphenated phrases do not count as one word");
  }
  if (value.includes("\n") || value.includes("\r")) {
    throw new Error("gate: entry must be a single line");
  }
  if (value.includes("\u2028") || value.includes("\u2029")) {
    throw new Error("gate: separators U+2028/U+2029 are not allowed");
  }
  if (value !== value.trim()) {
    throw new Error("gate: no leading or trailing whitespace");
  }
  if (/[\u0000-\u001f\u007f\ufeff\u200b-\u200d]/.test(value)) {
    throw new Error("gate: control or invisible characters are not allowed");
  }
  return size;
}

function writeEntry(value: string): string {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const tmp = `${outDir}/.entry.txt.tmp`;
  const dest = `${outDir}/entry.txt`;
  // Write to a sibling temp file and rename over the destination so
  // the published file is always complete. Permissions are set to
  // 0644 explicitly because the grader collects output as another user.
  writeFileSync(tmp, value, { encoding: "utf8", mode: 0o644 });
  chmodSync(tmp, 0o644);
  renameSync(tmp, dest);
  return dest;
}

function confirmWritten(path: string, expected: string): void {
  const onDisk = readFileSync(path, "utf8");
  if (onDisk !== expected) {
    throw new Error("verify: published file differs from the gated word");
  }
  if (onDisk.endsWith("\n") || onDisk.endsWith("\r")) {
    throw new Error("verify: published file must not end with a line break");
  }
  if (Buffer.byteLength(onDisk, "utf8") !== Buffer.byteLength(expected, "utf8")) {
    throw new Error("verify: byte length changed during write");
  }
}

const count = checkWord(word);
const finalPath = writeEntry(word);
confirmWritten(finalPath, word);
console.error(
  `entry written: ${count} chars, ${Buffer.byteLength(word, "utf8")} bytes, status ok`,
);
