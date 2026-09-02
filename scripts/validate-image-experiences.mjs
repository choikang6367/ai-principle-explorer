import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { imageExperiences } from '../src/data/imageExperiences.ts'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

function assertPercent(value, label) {
  assert.equal(typeof value, 'number', `${label} should be numeric`)
  assert.ok(Number.isFinite(value) && value >= 0 && value <= 100, `${label} should stay between 0 and 100`)
}

function assertRgb(value, label) {
  assert.equal(typeof value, 'number', `${label} should be numeric`)
  assert.ok(Number.isInteger(value) && value >= 0 && value <= 255, `${label} should be an RGB channel`)
}

assert.equal(imageExperiences.length, 10, 'image recognition should contain ten photo experiences')
assert.equal(new Set(imageExperiences.map((experience) => experience.id)).size, imageExperiences.length, 'image experience IDs should be unique')

for (const experience of imageExperiences) {
  assert.ok(experience.choices.includes(experience.answer), `${experience.id} answer should be one of its choices`)
  assert.doesNotThrow(() => statSync(resolve(projectRoot, 'public', experience.imagePath)), `${experience.id} photo asset should exist`)
  assert.equal(experience.pixelSamples.length, 4, `${experience.id} should have four pixel samples`)
  assert.equal(experience.features.length, 4, `${experience.id} should have four image features`)
  assert.equal(experience.predictionSnapshots.length, 3, `${experience.id} should have three prediction snapshots`)

  for (const sample of experience.pixelSamples) {
    assertPercent(sample.x, `${sample.id} x`)
    assertPercent(sample.y, `${sample.id} y`)
    assertRgb(sample.r, `${sample.id} red`)
    assertRgb(sample.g, `${sample.id} green`)
    assertRgb(sample.b, `${sample.id} blue`)
  }

  for (const feature of experience.features) {
    assertPercent(feature.x, `${feature.id} x`)
    assertPercent(feature.y, `${feature.id} y`)
    assertPercent(feature.width, `${feature.id} width`)
    assertPercent(feature.height, `${feature.id} height`)
    assert.ok(feature.x + feature.width <= 100, `${feature.id} should stay inside the photo horizontally`)
    assert.ok(feature.y + feature.height <= 100, `${feature.id} should stay inside the photo vertically`)
  }

  for (const snapshot of experience.predictionSnapshots) {
    assertPercent(snapshot.revealPercent, `${snapshot.id} reveal percent`)
    const probabilityTotal = snapshot.predictions.reduce((total, prediction) => total + prediction.probability, 0)
    assert.equal(probabilityTotal, 100, `${snapshot.id} probabilities should total 100`)
    assert.ok(snapshot.predictions.some((prediction) => prediction.label === experience.answer), `${snapshot.id} should include the answer candidate`)
  }
}

console.log('Image recognition validation passed: ten photo assets, pixel samples, feature boxes, and prediction snapshots are valid.')
