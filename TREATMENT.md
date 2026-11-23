# What If Your Mirror Showed You in 10 Years? — Kestrel Hill

**Style:** 2.5D Pixel Art (`hd-2d`) · **Language:** English · **Format:** 1920×1080, 30 fps · **Length:** 11 min 7 s (the measured voice lines set it) · **Tone:** dramatic

## Brief (summed up)

- Topic: *What if your mirror showed you in 10 years?* A **brand-new take**. The earlier film on the same question (`../mirror-ten-years`, Theo and the cello) is left untouched, and nothing from its story, characters, town or score comes back.
- About 8–10 minutes, dramatic. A few real facts are woven into the narration, with sources in `FACTS.md`.
- Narrator: the user's ElevenLabs voice "Storyteller Oxley – Grandpa" via AI33 (`../tools/tts_ai33.py`). Characters: Microsoft neural voices (edge-tts), low-passed "in the world".
- Original score. No storyboard stop. No material from the user.
- The render runs on GitHub Actions as 20 parallel parts. The soundtrack is pushed in 7 MB pieces and the film is downloaded from the run's Artifacts.

## 1. Three candidate structures

1. **The doorframe countdown.** A father sees himself at 51: alone, his daughter's door shut. On the reflected doorframe her pencilled height marks run to 15 and stop. He reads it as a death and tries to protect her from everything. Each morning the marks stop sooner. The turn is a letter held up in the glass: she didn't die, she left, because of him. The climax puts both of them on the town's funicular in a blizzard, where the only way to save her is to let her go. That is how a funicular works: one car rises because the other goes down.
2. **A town of mirrors.** Every mirror in a mountain town shows its owner ten years on, and the film tours five households, with the overworld map between them. It is broad and clever, but it has no single heart, and the drama stays shallow in 9 minutes.
3. **The future self as a stranger.** A woman meets her 10-years-older self and the two bargain through the glass: savings, habits, a job. It's close to a lecture about future-self psychology, and too close to the earlier film's "change your habits" arc.

**Chosen: 1.** It has one subject (Sam), one goal (keep Pip), a real misreading as the turn (fear is causing the very future he fears), and a native, physical climax: the counterweight of the funicular is the film's idea made into machinery. The ending answers the title. The mirror never showed fate; it showed the man he'd become if he stayed exactly as he was. That is the idea of the end of history illusion, dramatised without lecturing (the facts actually stated are listed in FACTS.md).

**Opening image:** a palm wipes a stripe through steam on a hall mirror, and the face behind it is grey-bearded and ten years older. **Ending:** the same mirror, the same palm-wipe, and now two people in the glass, the 51-year-old Sam and a 19-year-old Pip in railway overalls. Then a high dawn wide over the hill, where the two funicular cars pass exactly halfway, a rhyme of the night-time wide at the title. **Score shape:** a celesta "glass" motif (four notes) and a horn "father" theme. A low pizzicato *cable ostinato* is the funicular, and it stops dead when the power dies. The two themes finally play together on the release of the brakes.

## 2. Logline and arc

**Logline:** A funicular mechanic's hall mirror shows him ten years older and alone, and the pencil marks of his daughter's height stop at fifteen. He spends a month holding on to her so tightly that he nearly makes it come true.

- **Setup (Ch. I, The Man in the Glass):** the older face. Kestrel Hill and its funicular ("two cars, one cable; they pass exactly halfway"). The reflected flat: one chair, Pip's door shut, the height marks stopping at 15. Pip stands right next to him, and in the glass she isn't there. Facts: a mirror swaps front and back, not left and right; girls grow fastest at about 11–12 (the marks jump).
- **Development (Ch. II, Fifteen):** fear. No lake, no sled run, no funicular, no engine house. Odile at the ticket booth: "You can't keep a child in a jar." Every morning the marks stop sooner (14, 13, 12). The torn drawing of the big wheel.
- **Turn (Ch. III, The Letter):** the man in the glass holds a letter up, written backwards. Sam reads it in his shaving mirror (fact: Leonardo wrote his notebooks in mirror writing): *"I'm nineteen. I'm not coming home this Christmas… you never once asked me what I wanted."* She left; she didn't die. The festival evening: "We'll talk after." "You always say after."
- **Climax (Ch. IV, The Storm):** Pip rides the last car up to bring him the drawing. The storm takes the power, and both cars stop at the passing loop in the dark. Sam climbs down the service steps with a lantern (the carried light as a meter, dimming), talking to her on the radio. For the first time he asks what she wants, and listens. Lesson one: neither car moves alone; the heavier goes down and pulls the lighter up. On three they release the brakes: she rises to the warm engine house, he sinks into the dark. The power returns and the town's lights come on one by one up the hill.
- **Ending (Ch. V, Ten Years):** the mirror. The marks go all the way up, a note on the glass reads "Back for Christmas. Check car 2's brake. — P", and a 19-year-old in railway overalls is beside the old man. She is still leaving, but she is coming back. The real Pip pushes into frame: "Lesson two?" Dawn wide; the cars pass halfway.

## 3. Benchmark

- ***The Iron Giant* (Brad Bird, 1999)** and the "parent learns to let go" grammar of family adventure films. **Learn:** a quiet domestic first act whose stakes turn physical in a storm, and a climax where the emotional act and the mechanical act are the same act. **Don't take:** characters, designs, lines, music, shots.
- **Snow-night dioramas in 2.5D indie games (e.g. *Eastward*, Pixpil 2021, for lit windows in a cold world).** **Learn:** practicals carrying the story in a blue world, and one saturated colour to find a tiny figure. **Don't take:** any design, palette, character or music.

## 4. World, characters, light

**Kestrel Hill** (invented): a steep winter town on a mountainside. A two-car funicular runs straight up the slope, with houses stepping up either side. There is a passing loop exactly halfway, and service steps beside the track. The bottom station has Odile's ticket booth, a frozen lake and the festival lanterns. At the top station is the engine house (a big bull wheel and a brake lever), with Sam and Pip's flat above it.

Sets:
- **A — The flat:** a hallway with a tall mirror, Pip's door and its pencilled doorframe, the coat hooks, and a kitchen alcove. **Behind the glass** is a real mirror-image copy of the flat (the reflection is a set of its own, so the future can differ): calendar DEC 2036, one chair, an empty coat hook, Pip's door shut with boxes, and marks that stop. Key: cold dawn blue through the window against one warm bulb in the hall.
- **B — The hill:** the whole slope as a tabletop diorama. Keys: blue snow night (title, Ch. IV), pale winter morning (Ch. I–II), dusk with pink festival lanterns (Ch. III), blizzard (Ch. IV), gold dawn (end).
- **C — The engine house:** a cutaway with the bull wheel, the brake lever, a lamp and a radio. Key: warm amber against the snow-blue outside.
- **D — The two cars at the passing loop:** cut-away cabins on the slope, lit only by the lantern and Pip's torch.

Characters (pose-table pixel sprites at twice the pixel detail; 3/4 view, flipped for direction):
- **Sam Ferro (41):** dark hair, stubble, a **deep-green work jacket with a yellow hi-vis band**.
- **Sam at 51** (in the glass): grey hair and beard, the same jacket faded, glasses.
- **Pip Ferro (9):** a **red coat and a yellow knitted hat with a bobble**, the one saturated colour, findable in every wide. She draws machines.
- **Pip at 19** (in the glass, last chapter only): red railway overalls, hair tied back, a tool bag.
- **Odile Varga (70s):** the ticket-booth keeper and neighbour, with a plum shawl and a white bun.
- **Townsfolk:** 8 looks for the festival and the queue.

## 5. Shot list (plan; the final cut is locked to voice and the bar grid)

| # | Shot | Framing / angle | Move | Dur | Why |
|---|---|---|---|---|---|
| 1 | Steam on the mirror, a palm wipes; an older face | close, high 3/4 on the glass | locked, then a small push | 12 s | the hook in the first 3 s |
| 2 | Title: the hill at night, two lit cars passing halfway | very high, very far | slow push; band on the cars | 10 s | the whole world as a toy; the cable idea |
| 3 | The funicular explained: the cars, the loop, the flat at the top | high wide | lateral track up the slope | 20 s | where we are |
| 4 | The test: hand up, the older hand up | medium 3/4 on the mirror | near-static drift | 15 s | the rule of the mirror |
| 5 | Inventory of the reflected flat: calendar, one chair, the shut door | medium | lateral track along the glass | 18 s | the evidence |
| 6 | The doorframe: marks 5–9 real, 10–15 reflected, then nothing | insert, close | rack focus between real and reflected frames | 12 s | the wound |
| 7 | Pip beside him; not in the glass | medium two-shot | locked | 20 s | the chill |
| 8 | The end of history illusion | high wide of the morning hill, Sam walking Pip down | lateral track | 25 s | fact over routine |
| 9 | Bans: lake, sled run, funicular, Odile at the booth | top-down board of the hill, then dives | top-down → dive low | 60 s | the board game of fear |
| 10 | Mornings: 14, 13, 12 | insert on the reflected doorframe | locked, repeated | 20 s | the refrain that worsens |
| 11 | The torn drawing | medium kitchen, night | dive low and close | 25 s | the cost |
| 12 | The letter in the glass; the shaving mirror | close | rack focus, glass → hand mirror | 30 s | the turn |
| 13 | Two Sams sitting, facing | medium | locked | 12 s | the rhyme |
| 14 | Festival dusk: "You always say after" | medium-high 3/4 at the bottom station | near-static drift | 30 s | the break |
| 15 | Engine house; last car leaves; the call | medium interior | orbit half round the bull wheel | 20 s | the machine |
| 16 | Lightning, blackout ripple, both cars stop | very high wide | locked, flash curve | 12 s | the event |
| 17 | The climb: lantern down the service steps | lateral tracking, foreground blurred | track, camera leading | 45 s | travel; the meter |
| 18 | The radio talk: "What do you want?" | car close / Sam close, cross-cut | slow pushes | 40 s | listening |
| 19 | Two cars side by side, lantern to lantern | medium-high 3/4 | near-static drift | 40 s | the lesson |
| 20 | Release: the cars glide apart | very high, extra-wide | rising pull-back, focus handed from car to car | 20 s | **signature shot** |
| 21 | Power back: lights pop on up the hill; Pip at the wheel | high wide → engine house | push in | 25 s | consequence |
| 22 | The mirror again: marks to 19, the note, Pip at 19 | medium on the glass | lateral track along the glass | 40 s | the rhyme, changed |
| 23 | "Lesson two?" | medium two-shot | locked | 12 s | warmth |
| 24 | Dawn wide, the cars pass halfway; end title | very high | rising pull-back | 15 s | the bookend |

## 6. Beat sheet

The cold open runs 0–24 s and the title card sits at about 12–22 s. Ch. I runs to ≈130 s, Ch. II to ≈250 s, Ch. III to ≈330 s, Ch. IV to ≈460 s and Ch. V to the end (≈550 s). The exact seconds live in `story.js` (the timeline is the single source of truth). They come from the measured voice durations and are rounded to bar lines.

## 7. Cue map

- **Tempo:** 64 bpm in 4/4, so one bar = 3.75 s. Section downbeats land on chapter cards.
- **Cold open:** a sustained high string harmonic and the steam hiss; the celesta *glass motif* (E–B–G–F♯) on the reveal. A hit on the title card.
- **Ch. I:** harp arpeggios and the celesta, A minor. The *cable ostinato* (pizzicato cello, a low C–G pulse every half bar) under the funicular explanation. A pad alone on the doorframe, then silence on "Then they stopped."
- **Ch. II:** the ostinato tightens (every beat) with a low timpani on each ban. The glass motif on each morning, a semitone lower each time (the marks dropping). Near-silence after the torn drawing.
- **Ch. III:** a single held note under the letter, then **silence** with one heartbeat. The horn *father theme* enters softly when the two Sams sit. Festival dusk brings a small folk dance (recorder, hand drum) heard from the square, which an L-cut carries into "You always say after."
- **Ch. IV:** the ostinato returns as a storm drive (low strings, timpani). On the blackout a **hard stop** into a reverb tail; then wind only (the second real silence). The climb has the low choir pad and a heartbeat-slow timpani. On "What do you want?" a solo violin (Pip) answers the horn. On the brake release the glass motif and the father theme play together in C major, harp glissando, strings. Bells as the lights come on, one per window group.
- **Ch. V:** celesta and harp at a waltz-like lilt, then the full theme on the dawn wide; the last chord rings under the end title.

## 8. Sound design table

| Section | Ambience | Foley | Music |
|---|---|---|---|
| Cold open | hallway room tone, a kettle far off | steam hiss, palm squeak on glass, a recoil step on wood | harmonic → glass motif → title hit |
| Ch. I | winter morning: a crow, the cable's hum | cable clatter, car bell at stations, footsteps on snow and wood, door | harp, celesta, ostinato |
| Ch. II | lake wind, children far off, the booth's heater | ice creak, sled hiss, the booth window, paper tear, door slam | ostinato tighter, timpani, near-silence |
| Ch. III | quiet flat; dusk festival crowd | letter paper, shaving-mirror click, cloth | held note, silence and heartbeat, horn, folk band (L-cut) |
| Ch. IV | blizzard wind, creaking cable | bull wheel, phone ring, thunder, power-down whine, lantern creak, boots on steel steps, radio squelch, brake clunk, cable run | storm drive, hard stop, choir pad, the duet, bells |
| Ch. V | morning room tone; dawn birds, a far car bell | palm on glass, mugs, coat, door | celesta and harp, full theme |

## 9. Subtitles and titles

- Narration: Cormorant Garamond italic, burned in at about 48 px, centred low on a soft dark band, one line per clip, in 0.35 s before the voice. Exported as `subtitles_en.srt`, which isn't named like the video because the captions are burned in.
- Dialogue: a framed dialogue box with a gold border, corner ornaments and a name plate (SAM, PIP, ODILE). Text types over ~90 % of the line with a soft chime. Radio lines get a small "RADIO" tag in the name plate.
- Chapter cards in Cinzel: I The Man in the Glass · II Fifteen · III The Letter · IV The Storm · V Ten Years.
- The letter and the note on the glass are drawn as pixel paper in close-up, typed in Cormorant, and readable (held by `readcheck`).
- Title card: "WHAT IF YOUR MIRROR / SHOWED YOU IN 10 YEARS?" in Cinzel, with the tagline "Kestrel Hill" small beneath. End title: the same title, then "Made with code".
