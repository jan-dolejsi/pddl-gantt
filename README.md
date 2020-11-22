# Plan visualization for AI Planning

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
const planView = createPlanView("plan", onActionSelected, onHelpfulActionSelected, {
    disableSwimlanes: false, displayWidth: 300, epsilon: 1e-3
});

const planInfo = parser.PddlPlanParser.parseText(planText, 1e-3);

planView.showPlan(planInfo.getPlan(), 0);
```

## Compiling and contribution

To compile the component, run `npm run compile`.

To compile the sample, run `npm run compileSample`. Once it is compiled, run the sample by simply opening `sample.html` in a browser.
