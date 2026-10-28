# Turn any meeting into a follow-up email in 2 minutes

**The job it takes off your plate:** writing up a call. Paste the transcript and get a ready-to-send email with what you covered, what was decided, and who's doing what next.

The email has the same structure every time. It sticks to what was said in the meeting, with no added praise, advice or filler, and it notes at the bottom that it was drafted with AI.

## Set it up

1. In Claude Code, add the library once (skip this if you already have):
   `/plugin marketplace add gabeomat/futureproof-workflows`
2. Install this workflow:
   `/plugin install meeting-follow-up@futureproof-workflows`

There's nothing to connect. You need a transcript, which most recording tools create for you (Zoom, Fathom, Otter, Wispr Flow).

## Use it

Type `/meeting-follow-up`, paste the transcript, and say who it's for:

> /meeting-follow-up Write a follow-up for this call to Dana. I'm Chris.

Starting with `/meeting-follow-up` makes sure Claude uses this workflow and not its own idea of a follow-up email. Just asking for "a follow-up for this call" usually works too, but not every time.

You get two things back:

- **The email**, ready to copy into your inbox
- **Check before sending:** anything that needs your eyes first, like an action item with no owner or a name the transcript garbled

## What the email looks like

```
Subject: Summary and next steps from our call on Tuesday, November 3

Hi Dana,

Great call today. Here's a summary of what we covered and the next steps.

What we covered
- Spring hiring plan for two field crews
- Moving job scheduling out of the shared spreadsheet

Decisions
- Start with the scheduling move before hiring

Next steps
- Dana: send the current scheduling spreadsheet (by Friday)
- Chris: draft three scheduling tool options

Have a great week. If you have questions, let me know.

Chris

This summary was drafted with AI from our call transcript.
```

## Watch the walkthrough

VIDEO LINK

## Make it yours

What would you change about this for your business?
