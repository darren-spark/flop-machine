# The Wild Idea Machine

*A design journal: how a throwaway prompt became a tiny engine for terrible-on-purpose business ideas.*

---

## The Genesis

The prompt was exactly four words long:

> "Create a game that helps me generate new web-based business ideas."

No constraints. No mechanic. No tone. No target audience. Just a blank canvas and a vibe.

This is the kind of request where it's tempting to immediately start building the first thing that comes to mind — probably a chatbot that asks "what are you passionate about?" and spits out a five-paragraph market analysis. That would have been correct, useful, and completely forgettable.

Instead, two clarifying questions went out before any code was written:

1. **What game mechanic sounds most fun?** (slot machine, card draw, swipe-to-judge, speed round)
2. **Personalized to your background, or totally wild?** (pull from education/ADHD/sports/tech, or go random)

The answers set the whole tone:

> "A mashup of slot machine and speed round sounds fun. Totally wild and random."

That one sentence killed three boring versions of the app before they were ever built. It meant: no thoughtful ideation tool, no personalized recommendations, no curated prompts. Just chaos, a timer, and whatever sticks.

---

## v1: The Wild Idea Machine

The first build nailed down the core loop in about as few moving parts as possible:

- **Three reels** — WHO (the audience), IS STUCK BECAUSE (the problem), BUILD IT (the twist)
- **A 45-second timer** the moment the reels landed
- **A capture-or-trash decision** at the end of each round
- **The Vault** — persistent storage so captured ideas survived across sessions

The content pools were written to be deliberately weird but coherent: "Competitive birdwatchers," "Retired circus performers," "Goth accountants," each paired with oddly specific problems like "their entire community lives on one creaky forum from 2004" and twists like "as B2B SaaS with a very aggressive sales team."

The visual design leaned into arcade/retro-terminal aesthetic — Bungee display font, a magenta/amber/lime accent palette against a near-black radial gradient, subtle scanlines, textured shadow stacking on the title. The goal was to make it feel like a machine rather than a form. Machines get pulled. Forms get filled out.

The loop clicked on the first playthrough. The structural trick was the timer: once the reels stopped, you had 45 seconds to react to a deliberately absurd prompt. That pressure bypassed the internal critic that kills most ideation sessions before they start. You can't workshop "Nomadic RV dentists who can't tell their spouse how much they've spent, as a dating app" — you just type whatever your brain does with it.

---

## The Pivot Nobody Planned

The feedback on v1 was the best kind of feedback:

> "This is funny as shit. I love it, but let's see if you can make it better."

And then, after picking upgrades, a crucial aside:

> "The ideas it generates are genuinely terrible, but that's the beauty of this game you've built. This wasn't my intention but let's go with it."

This was the accidental discovery. The original framing was "help me generate new web-based business ideas" — past-tense good, future-tense useful. But what actually emerged was a **badness-as-a-feature** engine. The ideas weren't meant to be shipped. They were meant to be reacted to. The reactions were the real product. The terrible prompt was the tennis-ball machine; your gut response was the swing.

Once that reframe landed, everything about v2 got easier to design. The machine wasn't trying to produce quality output. It was trying to produce friction — enough weirdness to knock your brain loose from whatever rut it was in, so a real idea could sneak out the side door while you were busy laughing at "Haunted bed-and-breakfast owners as a group-buying cartel."

The footer got updated to acknowledge the new mission: **PROFESSIONALLY TERRIBLE IDEAS SINCE 2026.**

---

## v2: Sound, Locks, and Trash Talk

The upgrade round added three features, each solving a different problem:

### Sound FX (the dopamine loop)

The first version was silent, which made it feel like a form again. Tone.js synths were added to score the whole experience:

- A randomized MembraneSynth **clack** during the spin, firing every 90ms with pitches jittered across a low register so it sounds mechanical rather than metronomic
- Ascending **dings** (C → E → G) as each reel lands, so your ear tracks the spin even if your eyes don't
- A **cha-ching** arpeggio on capture — C, E, G, C across a quarter-second, because dopamine should be earned
- A sad **sawtooth buzz** on trash or timeout, because losing should sound like losing
- A mute toggle in the corner, because people work in offices and libraries

Audio deferred initialization until the first user gesture (Tone.start on first spin), which is required by browser autoplay policies.

### Lock + Reroll (the agency hack)

The slot machine metaphor was doing heavy lifting, but slot machines are passive — you pull, you accept what you get. Adding padlocks to each reel let the game flex toward active composition: freeze the audience you love, respin the problem until something clicks, lock in the twist, try a new audience.

A few small design decisions mattered here:

- Locked reels got a **dashed border** instead of solid, plus a subtle glow, so the state was readable at a glance
- The spin button **disables when all three are locked** with a hint telling you why
- Locks can't be toggled **mid-spin** (visual chaos)
- Each lock is its own padlock button anchored to the reel it controls, colored to match that reel's accent

The lock feature also changed the emotional pacing. Before, every spin was a clean slate. Now, you could chase a specific combo. Sometimes you'd lock two reels for three spins in a row and the fourth spin would finally land the thing.

### The Streak Meter (the trash talker)

The final addition was the feature that made the whole thing feel like a game instead of a tool. Each consecutive capture builds a streak, displayed with fire emojis and escalating taunts:

- 1: "ONE DOWN. THE FIRST IS ALWAYS FREE."
- 2: "TWO IN A ROW. CONCERNING."
- 3: "HAT TRICK. WE ARE IN THE WOODS."
- ...escalating through...
- 10: "A LEGEND AMONG CHARLATANS."
- 11+: "YOU ARE NOW THE PROBLEM."

Trashing an idea or letting the timer expire kills the streak and triggers a separate roast: "STREAK BROKEN. FINALLY, SOME TASTE." or "THE COMBO DIES. GOOD."

The streak banner pulses subtly at 2x and above (CSS keyframe animation, 1.4s ease-in-out scale and brightness). The break messages fade in and out over 3.2 seconds so they don't linger.

The reason this works is counterintuitive: the trash talk **rewards you for capturing more ideas** while also **making fun of you for capturing more ideas**. That tension is the whole point. It keeps the game from tipping into "I must produce quality output" — the machine is openly mocking the enterprise, so you stop taking your own output seriously, which means you capture more, which means you have more raw material to sift through later when you're back in your serious-adult brain.

---

## What's Actually Happening Here (The Design Thesis)

Strip away the neon and the sound design and this is a fairly simple cognitive tool:

1. **Forced absurdity** removes the pressure to produce quality, which paradoxically produces more usable raw material than a "serious" ideation session would.
2. **A timer** prevents the internal critic from running its usual audit.
3. **Capture friction is zero** — one button, freeform text, no categorization, no tagging, no "is this really a good idea?" checkpoint.
4. **Locks give selective agency** so the game doesn't feel passive, without letting you over-engineer any single combo.
5. **Streaks and sound** supply the dopamine that serious ideation tools are missing — which is why serious ideation tools don't get used.
6. **The Vault persists**, so the real value accumulates over time. Most of what's in there will be garbage. A few entries will be weirdly good. You won't know which is which when you capture them, and that's the design.

The ideas the machine produces are, as observed, mostly terrible. But the **reactions** they provoke aren't. And the reactions are what gets saved.

---

## Where It Could Go Next

Directions that weren't built but would fit the shape of the thing:

- **Export the Vault** as a clean text dump (the boring-but-useful version)
- **AI Roast/Steelman** — a button that either ruthlessly destroys your captured idea or builds the strongest possible case for it, both in-voice
- **Wildcard fourth reel** — a constraint card ("$0 budget," "launch in 14 days," "no code," "has to work in a browser tab while you're on a Zoom call")
- **Seed mode** — drop a real problem you're actually working on, and the machine generates absurd re-framings of it instead of pure randomness
- **Competitive mode** — two players, alternating spins, best reaction wins a round (judged by the other player)

None of these are urgent. The core loop works, and adding too much would dilute it.

---

## The Meta-Lesson

The most interesting thing about this build wasn't the final product — it was the moment the original goal ("generate good business ideas") got reframed mid-process into its opposite ("generate deliberately terrible ones"), and the app became *more* useful, not less.

A lot of tools fail because they refuse to do this. They stay locked onto their stated purpose even when the stated purpose isn't what anyone actually needs. The Wild Idea Machine works because it abandoned its job description in the first ten minutes and found a better one underneath.

Professionally terrible ideas since 2026.
