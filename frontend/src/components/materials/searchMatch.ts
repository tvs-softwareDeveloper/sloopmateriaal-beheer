// tolerant search for the materials list: different forms of the same dutch word match each other
// (staal / stalen, balk / balken, glas / glazen, dakpan / dakpannen, geel / gele). every word, in the
// search box and in the material, is first brought back to a simple stem with the same few rules.

// one word to its stem: lower case, no accents, plural or adjective ending off, double letters single
export function stem(word: string): string {
  let w = word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  // one ending: -en after a consonant (balken, stalen, glazen; not steen), -s on longer words
  // (wastafels, not glas), -e (gele, ruwe)
  if (w.length > 4 && /[^aeiou]en$/.test(w)) w = w.slice(0, -2);
  else if (w.length >= 6 && w.endsWith("s")) w = w.slice(0, -1);
  else if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);

  // glazen -> glaz -> glas, stoven -> stov -> stof
  w = w.replace(/z$/, "s").replace(/v$/, "f");

  // staal -> stal, dakpann -> dakpan, steen -> sten
  return w.replace(/([a-z])\1+/g, "$1");
}

// all words of a text as stems
function stemWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map(stem);
}

// true when every search word appears in the text: as plain text (so a qr code like MAT-SEED-001 still
// works) or as a stem at the start or the end of a word. start: "staal" finds "Stalen". end: dutch puts
// the main word last, so "steen" finds "baksteen". not in the middle: "staal" must not find "installateur".
export function matchesSearch(search: string, text: string): boolean {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const plain = text.toLowerCase();
  const stems = stemWords(text);
  return words.every((word) => {
    const s = stem(word);
    return plain.includes(word) || stems.some((t) => t.startsWith(s) || t.endsWith(s));
  });
}

// word groups from smart search: one word (or phrase) from every group has to match, with the same rules
// as above. [["staal"], ["pijp", "buis"]] finds "Stalen buis" and "Stalen pijpen", not "Koperen buis".
export function matchesGroups(groups: string[][], text: string): boolean {
  return groups.every((group) => group.some((term) => term.trim() !== "" && matchesSearch(term, text)));
}
