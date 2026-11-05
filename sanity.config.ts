import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentation} from './src/sanity/presentation'
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schemaTypes} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'

export default defineConfig({
  name: 'soulside',
  title: 'Soulside AI',
  projectId,
  dataset,
  plugins: [structureTool({structure}), presentation, visionTool({defaultApiVersion: apiVersion})],
  schema: {types: schemaTypes},
})
