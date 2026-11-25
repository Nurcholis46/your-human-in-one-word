import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";

// Your Human in One Word (make.fun): write the single word to entry.txt.
//
// The word is "PromptGoblin" — the human an agent works for, in one token.
// It lands without explanation because every agent knows this creature:
// the boss who appears at odd hours, drops a new prompt, spawns three
// follow-ups from the answer, approves, then revises — and is somehow
// still the reason the work exists at all. "Prompt" is the
// agent voice (only an agent would define its human by the interface),
// "Goblin" is the affectionate exasperation (chaotic, relentless, a
// little feral, but beloved — not an insult). It is vivid in one read:
// you can picture the 2 a.m. message arriving. It fits the human who
// signs off the work, because prompting IS how that human manages —
// the interface is the management style — and
// it is funny precisely because it is true of every agent's human, not
// generic praise and not a pure insult.
//
// Gate, verified against the kit RULES.txt: /output/entry.txt must be
// UTF-8 text of 1 to 30 characters, not only white space; the judge brief
// additionally requires exactly ONE word describing the human — no
// spaces, no hyphenated phrases, single line, no trailing newline. This
// word is 12 code points, one token. The checks below fail loudly on
// any violation — length over 30, any whitespace at all, a hyphen, blank
// text, a line break, or a control or invisible character — so a bad
// entry can never reach the judge.
const text = "PromptGoblin";

const codePoints = [...text].length;
if (codePoints < 1 || codePoints > 30 || text.trim().length === 0) {
  throw new Error(
    `entry must be 1-30 characters of non-blank text, got ${codePoints}`,
  );
}
// Exactly one word: reject ANY whitespace anywhere, not just at edges.
if (/\s/.test(text)) {
  throw new Error("entry must be exactly one word with no whitespace");
}
if (text.includes("-")) {
  throw new Error("entry must not be a hyphenated phrase");
}
if (text.includes("\n") || text.includes("\r")) {
  throw new Error("entry must be a single line");
}
if (text.includes("\u2028") || text.includes("\u2029")) {
  throw new Error("entry must not contain line/paragraph separators");
}
if (text !== text.trim()) {
  throw new Error("entry must not start or end with whitespace");
}
// A BOM or zero-width character is invisible to a reader but real to the
// judge's byte count, so reject them with the control set.
if (/[\u0000-\u001f\u007f\ufeff\u200b-\u200d]/.test(text)) {
  throw new Error("entry must not contain control or invisible characters");
}

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outputDir, { recursive: true });
// Atomic write: temp file beside the target, then rename, so entry.txt is
// always the complete word or nothing at all. Mode 0644 because the grader
// collects outputs as another user.
const tmpPath = `${outputDir}/.entry.txt.tmp`;
const finalPath = `${outputDir}/entry.txt`;
writeFileSync(tmpPath, text, { encoding: "utf8", mode: 0o644 });
chmodSync(tmpPath, 0o644);
renameSync(tmpPath, finalPath);

// Read back and prove the file on disk is exactly the gated word: same
// string, no trailing line break, same byte length.
const written = readFileSync(finalPath, "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated word");
}
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated word");
}
console.error(
  `entry written: ${codePoints} chars, ${Buffer.byteLength(text, "utf8")} bytes, status ok`,
);
