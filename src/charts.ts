/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2020. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */


export function isInViewport(el: HTMLElement): boolean {
    if (["hidden", "collapse"].includes(el.style.visibility)) { return false; }
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace google {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace charts {
        function load(version: string, options: { packages: string[] }): void;

        export class ChartOptions {

        }

        export class Line {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            static convertOptions(options: any): ChartOptions;

        }
    }

    // eslint-disable-next-line @typescript-eslint/no-namespace
    export namespace visualization {
        export class DataTable {
            addColumn(type: string, legend: string): void;
            addRows(rows: unknown): void;
        }

        interface Chart {
            draw(chartData: DataTable, chartOptions: charts.ChartOptions): void;
        }

        export class ComboChart implements Chart {
            constructor(host: HTMLElement);
            draw(chartData: DataTable, chartOptions: charts.ChartOptions): void;
        }

        export class LineChart implements Chart {
            constructor(host: HTMLElement);
            draw(chartData: DataTable, chartOptions: charts.ChartOptions): void;
        }

        // eslint-disable-next-line @typescript-eslint/no-namespace
        export namespace events {
            // eslint-disable-next-line @typescript-eslint/no-empty-interface
            interface ChartEventListener { }

            function addListener(chart: Chart, eventName: string, handler: () => void): ChartEventListener;
            function removeListener(chartSelectEvent: ChartEventListener): void;
        }
    }
}


let chartDefined = false;

try {
    google.charts.load('current', { packages: ['corechart', 'line'] });
    chartDefined = true;
}
catch (err) {
    console.log(err);
}


export function drawChart(chartDiv: HTMLDivElement, functionName: string, unit: string, objects: string[], columnData: (number | null)[][]): void {

    if (!chartDefined) { return;}

    const data = new google.visualization.DataTable();
    data.addColumn('number', 'X');

    objects.forEach(obj => {
        data.addColumn('number', obj);
    });

    data.addRows(columnData);

    const options = {
        hAxis: {
            title: 'Time'
        },
        vAxis: {
            title: unit,
            scaleType: 'linear' //vAxisScaleType = 'log'
        },
        interpolateNulls: false,
        title: functionName
    };

    const chart = new google.visualization.LineChart(chartDiv);

    chart.draw(data, options);
}