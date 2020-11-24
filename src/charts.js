

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createDataTable(variableName, variableData) {
    const data = new google.visualization.DataTable();
    data.addColumn('number', 'X');
    data.addColumn('number', variableName);

    data.addRows(variableData);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function drawChartMultipleSeries(chartDivId, functionName, unit, objects, columnData) {

    const data = columnData.map(variableData, variableName => createDataTable(variableName, variableData));

    const options = {
        hAxis: {
            title: 'Time'
        },
        vAxis: {
            title: unit,
            scaleType: 'linear' //vAxisScaleType = 'log'
        },
        interpolateNulls: true,
        title: functionName
    };

    const chart = new google.visualization.LineChart(document.getElementById(chartDivId));

    chart.draw(data, options);
}