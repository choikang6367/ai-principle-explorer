import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  defaultImagePromptSelections,
  getImageComparisonSelections,
  getImagePromptChoice,
  getImagePromptClues,
  getImagePromptPreset,
  getImagePromptSentence,
  imagePromptQualityCues,
  imagePromptQualitySentence,
  imageCheckItems,
  imageComparisonOptions,
  imageDenoiseSteps,
  imagePromptFields,
  imagePromptPresets,
} from '../src/data/imageGeneration.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const requiredPromptParts = new Set(['subject', 'scene', 'place', 'style', 'mood'])

function report(message) {
  errors.push(message)
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    report(`${label} must be a non-empty string`)
  }
}

if (imagePromptFields.length !== requiredPromptParts.size) {
  report(`expected ${requiredPromptParts.size} prompt fields, found ${imagePromptFields.length}`)
}

const fieldIds = new Set()
for (const field of imagePromptFields) {
  if (fieldIds.has(field.id)) {
    report(`prompt field ${field.id} has a duplicate id`)
  }
  fieldIds.add(field.id)
  if (!requiredPromptParts.has(field.id)) {
    report(`prompt field ${field.id} is not one of the required parts`)
  }
  requireText(field.label, `prompt field ${field.id}.label`)
  requireText(field.question, `prompt field ${field.id}.question`)

  const choiceIds = new Set()
  if (field.choices.length < 3) {
    report(`prompt field ${field.id} should provide at least three choices`)
  }
  for (const choice of field.choices) {
    if (choiceIds.has(choice.id)) {
      report(`prompt field ${field.id} has duplicate choice ${choice.id}`)
    }
    choiceIds.add(choice.id)
    requireText(choice.label, `choice ${field.id}/${choice.id}.label`)
    requireText(choice.description, `choice ${field.id}/${choice.id}.description`)
    requireText(choice.promptText, `choice ${field.id}/${choice.id}.promptText`)
    if (!Array.isArray(choice.signals) || choice.signals.length !== 3 || choice.signals.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
      report(`choice ${field.id}/${choice.id} should contain three bounded numeric signals`)
    }
  }
}

for (const part of requiredPromptParts) {
  if (!fieldIds.has(part)) {
    report(`missing required prompt field ${part}`)
  }
}

for (const [part, choiceId] of Object.entries(defaultImagePromptSelections)) {
  if (!getImagePromptChoice(part, choiceId)) {
    report(`default prompt selection ${part}/${choiceId} is not a valid choice`)
  }
}

if (imagePromptPresets.length !== 3) {
  report(`expected 3 curated prompt presets, found ${imagePromptPresets.length}`)
}
const presetIds = new Set()
const presetPaths = new Set()
for (const preset of imagePromptPresets) {
  if (presetIds.has(preset.id)) {
    report(`prompt preset ${preset.id} has a duplicate id`)
  }
  presetIds.add(preset.id)
  if (presetPaths.has(preset.imagePath)) {
    report(`prompt preset ${preset.id} reuses image path ${preset.imagePath}`)
  }
  presetPaths.add(preset.imagePath)
  requireText(preset.title, `prompt preset ${preset.id}.title`)
  requireText(preset.description, `prompt preset ${preset.id}.description`)
  requireText(preset.imageAlt, `prompt preset ${preset.id}.imageAlt`)
  if (!existsSync(join(root, 'public', preset.imagePath))) {
    report(`prompt preset ${preset.id} image is missing at ${preset.imagePath}`)
  }
  for (const [part, choiceId] of Object.entries(preset.selections)) {
    if (!getImagePromptChoice(part, choiceId)) {
      report(`prompt preset ${preset.id} has invalid selection ${part}/${choiceId}`)
    }
  }
  if (getImagePromptPreset(preset.selections)?.id !== preset.id) {
    report(`prompt preset ${preset.id} cannot be resolved from its selections`)
  }
}

const defaultSentence = getImagePromptSentence(defaultImagePromptSelections)
requireText(defaultSentence, 'default prompt sentence')
requireText(imagePromptQualitySentence, 'image prompt quality sentence')
for (const cue of imagePromptQualityCues) {
  if (!defaultSentence.includes(cue)) {
    report(`default prompt sentence should include quality cue ${cue}`)
  }
}
for (const field of imagePromptFields) {
  const selectedChoice = getImagePromptChoice(field.id, defaultImagePromptSelections[field.id])
  if (selectedChoice && !defaultSentence.includes(selectedChoice.promptText)) {
    report(`default prompt sentence should include ${field.id} choice text`)
  }
}

const defaultClues = getImagePromptClues(defaultImagePromptSelections)
if (defaultClues.length !== imagePromptFields.length) {
  report(`expected one clue per prompt field, found ${defaultClues.length}`)
}
const clueIds = new Set()
for (const clue of defaultClues) {
  if (clueIds.has(clue.id)) {
    report(`image clue ${clue.id} has a duplicate id`)
  }
  clueIds.add(clue.id)
  if (!fieldIds.has(clue.part)) {
    report(`image clue ${clue.id} references unknown prompt part ${clue.part}`)
  }
  requireText(clue.phrase, `image clue ${clue.id}.phrase`)
  requireText(clue.description, `image clue ${clue.id}.description`)
  requireText(clue.areaLabel, `image clue ${clue.id}.areaLabel`)
  if ([clue.x, clue.y, clue.width, clue.height].some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    report(`image clue ${clue.id} should have bounded overlay coordinates`)
  }
}

if (imageDenoiseSteps.length < 5 || imageDenoiseSteps.length > 8) {
  report(`expected 5 to 8 denoise stages, found ${imageDenoiseSteps.length}`)
}
const stepIds = new Set()
const stepPaths = new Set()
let previousReveal = -1
for (const step of imageDenoiseSteps) {
  if (stepIds.has(step.id)) {
    report(`denoise step ${step.id} has a duplicate id`)
  }
  stepIds.add(step.id)
  if (stepPaths.has(step.imagePath)) {
    report(`denoise step ${step.id} reuses image path ${step.imagePath}`)
  }
  stepPaths.add(step.imagePath)
  requireText(step.title, `denoise step ${step.id}.title`)
  requireText(step.description, `denoise step ${step.id}.description`)
  requireText(step.alt, `denoise step ${step.id}.alt`)
  if (!existsSync(join(root, 'public', step.imagePath))) {
    report(`denoise step ${step.id} image is missing at ${step.imagePath}`)
  }
  if (!Number.isFinite(step.revealPercent) || step.revealPercent < 0 || step.revealPercent > 100 || step.revealPercent < previousReveal) {
    report(`denoise step ${step.id} has an invalid reveal order`)
  }
  if (!Array.isArray(step.activeParts)) {
    report(`denoise step ${step.id} should provide active prompt parts`)
  } else {
    const activeParts = new Set(step.activeParts)
    if (activeParts.size !== step.activeParts.length) {
      report(`denoise step ${step.id} has duplicate active prompt parts`)
    }
    for (const part of activeParts) {
      if (!requiredPromptParts.has(part)) {
        report(`denoise step ${step.id} references unknown active prompt part ${part}`)
      }
    }
  }
  previousReveal = step.revealPercent
}
if (imageDenoiseSteps[0]?.id !== 'noise' || imageDenoiseSteps.at(-1)?.id !== 'final') {
  report('denoise stages should start with noise and end with final')
}
if (imageDenoiseSteps[0]?.activeParts.length !== 0) {
  report('noise stage should not expose any prompt part')
}
const finalActiveParts = new Set(imageDenoiseSteps.at(-1)?.activeParts ?? [])
if (finalActiveParts.size !== requiredPromptParts.size || [...requiredPromptParts].some((part) => !finalActiveParts.has(part))) {
  report('final denoise stage should include every prompt part')
}

const comparisonIds = new Set()
const comparisonParts = new Set()
for (const comparison of imageComparisonOptions) {
  if (comparisonIds.has(comparison.id)) {
    report(`comparison ${comparison.id} has a duplicate id`)
  }
  comparisonIds.add(comparison.id)
  comparisonParts.add(comparison.part)
  if (comparison.alternativeChoiceId === defaultImagePromptSelections[comparison.part]) {
    report(`comparison ${comparison.id} should change the default ${comparison.part} choice`)
  }
  if (!getImagePromptChoice(comparison.part, comparison.alternativeChoiceId)) {
    report(`comparison ${comparison.id} references an unknown alternative choice`)
  }
  requireText(comparison.changeLabel, `comparison ${comparison.id}.changeLabel`)
  requireText(comparison.description, `comparison ${comparison.id}.description`)
  requireText(comparison.cueImageAlt, `comparison ${comparison.id}.cueImageAlt`)
  if (!existsSync(join(root, 'public', comparison.cueImagePath))) {
    report(`comparison ${comparison.id} image is missing at ${comparison.cueImagePath}`)
  }
  const changedSelections = getImageComparisonSelections(defaultImagePromptSelections, comparison)
  if (changedSelections[comparison.part] === defaultImagePromptSelections[comparison.part]) {
    report(`comparison ${comparison.id} does not change its selected prompt part`)
  }
}
for (const part of ['place', 'style', 'mood']) {
  if (!comparisonParts.has(part)) {
    report(`missing required prompt comparison for ${part}`)
  }
}

if (imageCheckItems.length === 0) {
  report('image check list must not be empty')
}
const checkIds = new Set()
for (const item of imageCheckItems) {
  if (checkIds.has(item.id)) {
    report(`image check item ${item.id} has a duplicate id`)
  }
  checkIds.add(item.id)
  requireText(item.label, `image check ${item.id}.label`)
  requireText(item.description, `image check ${item.id}.description`)
}

assert.equal(fieldIds.size, requiredPromptParts.size, 'prompt field IDs should be unique')

if (errors.length > 0) {
  console.error(`Image generation validation failed with ${errors.length} error(s):`)
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
} else {
  console.log(`Image generation validation passed: ${imagePromptFields.length} prompt fields, ${imagePromptPresets.length} curated results, ${imageDenoiseSteps.length} denoise stages, ${imageComparisonOptions.length} comparisons, and ${imageCheckItems.length} review checks.`)
}
