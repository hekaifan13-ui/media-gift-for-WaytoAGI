# Plan: One Project = All Three Templates

## Context
Currently, one project stores a single `template_id` and single `PostcardData`. The user wants each project to contain data for **all three** card templates (Modern, Code, Livestream). The Editor's back button should return to the acrylic box (IntroBox template selection) to switch templates, not to the project list.

## New User Flow
```
ProjectList → (create/load) → IntroBox (acrylic box, SELECTION state) → pick template → Editor
Editor [Back] → IntroBox (same project, pick another template)
IntroBox [Close] → ProjectList
```

## Changes

### 1. `types.ts` — New composite data type
- Add `ProjectAllData = Record<TemplateId, PostcardData>` — stores one `PostcardData` per template.

### 2. `constants.ts` — Default data for all templates
- Create `INITIAL_PROJECT_DATA: ProjectAllData` with sensible defaults per template (reuse existing `INITIAL_DATA` for Livestream, create similar defaults for Modern and Code).

### 3. `App.tsx` — Core flow rewrite
- State: `projectData: ProjectAllData` + `activeTemplate: TemplateId`
- `handleNewProject()` → init `projectData` to defaults → go to `SELECTION`
- `handleLoadProject(project)` → load `projectData` from DB → go to `SELECTION`
- `handleSelectTemplate(id)` → set `activeTemplate` → go to `EDITOR`
- `handleBack()` (from Editor) → go to `SELECTION` (not `PROJECTS`)
- `handleBoxClose()` (IntroBox close) → go to `PROJECTS`
- `updateData(key, value)` → update only `projectData[activeTemplate]`
- Save passes entire `projectData` to storage service
- Add backward compatibility: if loaded project has old single-PostcardData format, migrate on load.

### 4. `services/storageService.ts` — Type update
- `ProjectRow.data` type: `ProjectAllData` (was `PostcardData`)
- `createProject(title, projectAllData)` — remove separate `templateId` param
- `updateProject` accepts `ProjectAllData`

### 5. `components/IntroBox.tsx` — Skip intro animation on return
- When navigating back from Editor, go directly to `SELECTION` (box already open), skip the "tap to open" intro state.

### 6. `components/Editor.tsx` — Back goes to SELECTION
- `onBack` prop behavior unchanged; `App.tsx` wires it to go to `SELECTION`.
- Save uses combined `projectData`.

### 7. `components/ProjectList.tsx` — Minor display tweak
- Template badge shows "All" or list of 3 template names instead of single template_id.

### 8. DB Migration (optional)
- `template_id` column becomes less meaningful (always "ALL" or nullable). No schema change needed since `data` is JSONB and accepts any shape.

## Files Modified
- `types.ts`
- `constants.ts`
- `App.tsx`
- `services/storageService.ts`
- `components/IntroBox.tsx`
- `components/Editor.tsx`
- `components/ProjectList.tsx`

## Verification
1. Create new project → acrylic box opens → pick Modern → edit → back → box shown → pick Livestream → previous Livestream data preserved
2. Save project → reload → load project → box opens → all three templates retain their data
3. Old projects (single-template data) still load correctly via migration layer
