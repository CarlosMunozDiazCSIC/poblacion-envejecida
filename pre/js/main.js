import { getIframeParams } from './height';
import { setChartCanvas, setChartCanvasImage } from './canvas-image';
import { setRRSSLinks } from './rrss';
import { getInTooltip, getOutTooltip, positionTooltip } from './tooltip';
import { numberWithCommas } from './helpers';
import './tabs';
import 'url-search-params-polyfill';

//Desarrollo de la visualización
import * as d3 from 'd3';
import * as topojson from "topojson-client";
let d3_composite = require("d3-composite-projections");

//Necesario para importar los estilos de forma automática en la etiqueta 'style' del html final
import '../css/main.scss';

///// VISUALIZACIÓN DEL GRÁFICO //////
let chartBlock = d3.select('#chart');
let tooltip = d3.select('#tooltip');

const width = parseInt(chartBlock.style('width'));
const height = parseInt(chartBlock.style('height'));

let mapLayer = chartBlock.append('svg').attr('id', 'map').attr('width', width).attr('height', height);

const csv = d3.dsvFormat(";");

d3.queue()
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/poblacion-envejecida/main/data/municipios.json')
    .defer(d3.text, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/poblacion-envejecida/main/data/padron_refinado.csv')
    .await(main);

function main(error, municipios, aux) {
    if (error) throw error;

    let data = csv.parse(aux);

    let muni = topojson.feature(provincias, municipios.objects.municipios);

    ///HACEMOS EL JOIN
    muni.features.forEach(function(item) {

    });

    let projection = d3_composite.geoConicConformalSpain().scale(2000).fitSize([width,height], muni);
    let path = d3.geoPath(projection);

    mapLayer.selectAll(".provincias")
        .data(muni.features)
        .enter()
        .append("path")
        .attr("class", "provincias")
        .style('fill', function(d) {
            let color = '';
            let _65 = d.properties.total_porc_mas65 * 100;
            let _80 = d.properties.total_porc_mas80 * 100;

            if(_65 > 10 && _65 < 17.25) {

                if(_80 >= 0 && _80 < 4.3) {
                    color = '#e8e8e8';
                } else if (_80 >= 4.3 && _80 < 8.6) {
                    color = '#b8d6be';
                } else {
                    color = '#73ae7f';
                }

            } else if (_65 >= 17.25 && _65 < 24.5) {

                if(_80 >= 0 && _80 < 4.3) {
                    color = '#b5c0da';
                } else if (_80 >= 4.3 && _80 < 8.6) {
                    color = '#8fb2b3';
                } else {
                    color = '#5a9178';
                }

            } else {

                if(_80 >= 0 && _80 < 4.3) {
                    color = '#6c83b5';
                } else if (_80 >= 4.3 && _80 < 8.6) {
                    color = '#567994';
                } else {
                    color = '#2b5a5b';
                }

            }

            return color;
        })
        .style('stroke', '#282828')
        .style('stroke-width', '0.25px')
        .attr("d", path)
        .on('click', function(d,i,e){
            console.log(d);
            //Línea diferencial y cambio del polígonos
            // let currentProv = this;
            
            // document.getElementsByTagName('svg')[0].removeChild(this);
            // document.getElementsByTagName('svg')[0].appendChild(currentProv);

            // currentProv.style.stroke = '#000';
            // currentProv.style.strokeWidth = '1px';

            // //Elemento HTML > Tooltip (mostrar nombre de provincia, año y Proporcións para más de 100 años)
            // let html = '<p class="chart__tooltip--title">' + d.properties.name + '<p class="chart__tooltip--text">Proporción general (100 años o más): ' + numberWithCommas(d.properties.prop_total_65_100 + '</p>' + 
            // '<p class="chart__tooltip--text">Proporción en mujeres (100 años o más): ' + numberWithCommas(d.properties.prop_mujeres_65_100 + '</p>' + 
            // '<p class="chart__tooltip--text">Proporción en hombres (100 años o más): ' + numberWithCommas(d.properties.prop_hombres_65_100 + '</p>';

            // tooltip.html(html);

            // //Tooltip
            // getInTooltip(tooltip);                
            // positionTooltip(window.event, tooltip);
        })
        .on('mouseout', function(d,i,e) {
            //Línea diferencial
            this.style.stroke = '#282828';
            this.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip); 
        });

    mapLayer.append('path')
        .style('fill', 'none')
        .style('stroke', '#000')
        .attr('d', projection.getCompositionBorders());

    setChartCanvas();
}

///// REDES SOCIALES /////
setRRSSLinks();

///// ALTURA DEL BLOQUE DEL GRÁFICO //////
getIframeParams();

///// DESCARGA COMO PNG O SVG > DOS PASOS/////
let pngDownload = document.getElementById('pngImage');

pngDownload.addEventListener('click', function(){
    setChartCanvasImage();
});