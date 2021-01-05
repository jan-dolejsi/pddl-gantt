# Plan visualization for AI Planning

[![CI](https://github.com/jan-dolejsi/pddl-gantt/workflows/Build/badge.svg)](https://github.com/jan-dolejsi/pddl-gantt/actions?query=workflow%3ABuild)
[![npm](https://img.shields.io/npm/v/pddl-gantt)](https://www.npmjs.com/package/pddl-gantt)

This repo hosts the default plan visualization component liberated from the [VS Code extension for PDDL](https://marketplace.visualstudio.com/items?itemName=jan-dolejsi.pddl).

[![Plan visualization in VS Code](https://raw.githubusercontent.com/wiki/jan-dolejsi/vscode-pddl/img/PDDL_plan.gif)]

## Usage

The sample built into this repo is using [Browserify](http://browserify.org/) with the [Tsify](https://github.com/TypeStrong/tsify) plugin to build the component from the developer comfort of Typescript with support of NPM packaging. It may be possible to use it from plain HTML+Javascript context.

```html
<script defer src="../out-sample/sample.js"></script>
<div id="plan"></div>
```

See the full [sample.html](sample/sample.html).

```javascript
const planView = createPlanView("plan", {
        disableSwimlanes: false, 
        displayWidth: 600, 
        epsilon: 1e-3,
        onActionSelected: actionName => console.log('Selected: ' + actionName)
    });

const planInfo = new parser.PddlPlanParser().parseText(planText, 1e-3);

planView.showPlan(planInfo.getPlan());
```

## Compiling and contribution

To compile the component, run `npm run compile`.

To compile the sample, run `npm run compileSample`. Once it is compiled, run the sample by simply opening `sample.html` in a browser.

In VS Code just press _F5_.
