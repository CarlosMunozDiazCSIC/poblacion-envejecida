import { getIframeParams } from './height';
import { setChartCanvas, setChartCanvasImage } from './canvas-image';
import { setRRSSLinks } from './rrss';
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
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/poblacion-envejecida/main/data/provincias.json')
    .defer(d3.text, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/poblacion-envejecida/main/data/padron_refinado.csv')
    .await(main);

function main(error, municipios, provincias, aux) {
    if (error) throw error;

    let data = csv.parse(aux);
    let muni = topojson.feature(municipios, municipios.objects.municipios);
    console.log(provincias);

    ///HACEMOS EL JOIN
    muni.features.forEach(function(item) {
        let join = data.filter(function(subItem) {
            if(subItem.Municipios.substr(0,5) == item.properties.Codigo) {
                return subItem;
            }
        });
        join = join[0];
        item.data = join;
    });

    //Uso de colores
    let colors = d3.scaleLinear()
        .domain([15,30,45,80])
        .range(['#a7e7e7', '#68a7a7', '#2b6b6c', '#003334']);

    let projection = d3_composite.geoConicConformalSpain().scale(2000).fitSize([width,height], muni);
    let path = d3.geoPath(projection);

    mapLayer.selectAll(".mun")
        .data(muni.features)
        .enter()
        .append("path")
        .attr("class", "mun")
        .style('fill', function(d) {
            if(d.data) {
                if (d.data.porc_envejecido != 'NA') {
                    return colors(+d.data.porc_envejecido.replace(',','.'));
                } else {
                    return '#ccc';
                }                
            } else {
                return '#ccc';
            }
            
        })
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