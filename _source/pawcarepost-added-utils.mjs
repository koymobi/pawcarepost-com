import addenda from './pawcarepost-added-addenda.mjs';
const finalNotes = {
  'what-does-bad-breath-in-pets-mean': 'If the odor is accompanied by a lump under the jaw or near an eye, mention the location and whether it appeared quickly. Do not press the swelling to test it. Note if the pet resists touch on one side of the face. A clinic can decide how soon an examination is needed and whether the concern is confined to the mouth. Your observation is valuable without trying to name the condition.',
  'how-to-read-a-pet-food-label': 'A label is also a way to avoid accidental species mix-ups. Dog and cat foods can look similar on a shelf, yet their nutritional requirements differ. Check the species statement every time a household has both animals, especially when packages share a design. Store foods separately and explain the distinction to anyone who feeds the pets. If a pet has been eating the wrong product regularly, ask a veterinarian how to correct the diet safely.',
  'how-to-switch-dog-food-gradually': 'If a new bag has a different batch number but the same recipe, it usually does not require the same transition as an entirely new diet. Still inspect the food and observe your dog. If the manufacturer announces a formula change, ask what changed and consider whether a gradual transition is useful. Keep a photo of both labels. This prevents a quiet recipe change from being mistaken for a new medical problem or for a reaction to an unrelated treat.',
  'how-to-teach-a-dog-to-settle-on-a-mat': 'A cue can be used politely without being repeated. Say it once in a setting where the dog has a good chance of responding. If the dog does not approach, make the path easier or return to a simpler environment instead of saying the word louder. Repeated cues in a hard situation teach little. During practice, reward the dog for choosing the mat even before a verbal cue is added, then pair the word with that familiar action.',
  'daily-routine-for-an-indoor-cat': 'A cat who prefers solitude still needs accessible options. Put a hiding box where visitors cannot reach in, maintain a clear route to water and litter, and let the cat emerge on its own. A shy cat may play after the room becomes quiet rather than during a busy family hour. Offering the same calm opportunity regularly can reveal a preference that a rigid schedule misses. Choice is a practical design feature of the home, not simply a personality label.'
};

export function addedArticle(data) {
  const sections = data.sections.map(({ heading, body }) => [heading, ...body.trim().split(/\n\s*\n/).map(paragraph => paragraph.replace(/\s+/g, ' ').trim())]);
  if (addenda[data.slug]) sections[4].push(...addenda[data.slug].trim().split(/\n\s*\n/).map(paragraph => paragraph.replace(/\s+/g, ' ').trim()));
  if (finalNotes[data.slug]) sections[4].push(finalNotes[data.slug]);
  return {
    ...data,
    added: true,
    sections,
  };
}
