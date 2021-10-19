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

const width = parseInt(chartBlock.style('width'));
const height = parseInt(chartBlock.style('height'));

let mapLayer = chartBlock.append('svg').attr('id', 'map').attr('width', width).attr('height', height);
let data, muni, provs;
let projection, path;

const csv = d3.dsvFormat(";");

d3.queue()
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/poblacion-envejecida/main/data/municipios.json')
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/poblacion-envejecida/main/data/provincias.json')
    .defer(d3.text, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/poblacion-envejecida/main/data/padron_refinado.csv')
    .await(main);

function main(error, municipios, provincias, aux) {
    if (error) throw error;

    data = csv.parse(aux);
    muni = topojson.feature(municipios, municipios.objects.municipios);
    provs = topojson.feature(provincias, provincias.objects.provs);

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

    projection = d3_composite.geoConicConformalSpain().scale(2000).fitSize([width,height], muni);
    path = d3.geoPath(projection);

    mapLayer.selectAll(".mun")
        .data(muni.features)
        .enter()
        .append("path")
        .attr("class", "mun")
        .style('stroke','none')
        .style('opacity', '1')
        .style('fill', function(d) {
            if(d.data) {
                if (d.data.porc_envejecido != 'NA') {
                    let color = '';
                    let env = +d.data.porc_envejecido.replace(',','.');
                    let total = +d.data.total;

                    if ( total < 1000) {
                        if (env < 15) {
                            color = '#e8e8e8';
                        } else if (env >= 15 && env < 30) {
                            color = '#b5c0da';
                        } else {
                            color = '#6c83b5';
                        }
                    } else if ( total >= 1000 && total < 20000) {
                        if (env < 15) {
                            color = '#b8d6be';
                        } else if (env >= 15 && env < 30) {
                            color = '#8fb2b3';
                        } else {
                            color = '#567994';
                        }
                    } else {
                        if (env < 15) {
                            color = '#73ae7f';
                        } else if (env >= 15 && env < 30) {
                            color = '#5a9178';
                        } else {
                            color = '#2b5a5b';
                        }
                    }

                    return color;


                } else {
                    return '#ccc';
                }                
            } else {
                return '#ccc';
            }            
        })
        .attr("d", path);

    mapLayer.append('path')
        .style('fill', 'none')
        .style('stroke', '#000')
        .attr('d', projection.getCompositionBorders());

    mapLayer.selectAll('.prov')
        .data(provs.features)
        .enter()
        .append('path')
        .attr('d', path)
        .style('stroke-width','0.25px')
        .style('stroke', '#000')
        .style('fill', 'transparent');

    setChartCanvas();
}

let leyenda = document.getElementsByClassName('legend__viz')[0];
let bloquesLeyenda = leyenda.getElementsByTagName('div');

for (let i = 0; i < bloquesLeyenda.length; i++) {
    bloquesLeyenda[i].addEventListener('mouseover', function(e) {
        for (let i = 0; i < bloquesLeyenda.length; i++) {
            bloquesLeyenda[i].style.border = '0px';
        }
        this.style.border = '1.5px solid';
        setCities(this.getAttribute('data-type'));
    });

    bloquesLeyenda[i].addEventListener('mouseout', function(e) {
        this.style.border = '0px solid';
        setCities();
    });
}

function setCities(tipo) {
    if(tipo) {
        mapLayer.selectAll(".mun")
            .data(muni.features)
            .style('opacity', function(d) {
                if(d.data) {
                    if(d.data.porc_envejecido != 'NA') {
                        let env = +d.data.porc_envejecido.replace(',','.');
                        let total = +d.data.total;

                        return setStroke(tipo, total, env, '1', '0.25');
                    } else {
                        return '0.25';
                    }

                } else {
                    return '0.25';
                }
            })
            .style('stroke-width', function(d) {
                if(d.data) {
                    if(d.data.porc_envejecido != 'NA') {
                        let env = +d.data.porc_envejecido.replace(',','.');
                        let total = +d.data.total;

                        return setStroke(tipo, total, env, '0.25px', '0px');
                    } else {
                        return '0px';
                    }

                } else {
                    return '0px';
                }
            })
            .style('stroke', function(d) {
                if(d.data) {
                    if(d.data.porc_envejecido != 'NA') {
                        let env = +d.data.porc_envejecido.replace(',','.');
                        let total = +d.data.total;

                        return setStroke(tipo, total, env, '#262626', 'none');
                    } else {
                        return 'none';
                    }

                } else {
                    return 'none';
                }
            })

    } else {
        mapLayer.selectAll(".mun")
            .style('opacity', '1');
    }
}

function setStroke(tipo, total, env, first, second) {
    if(tipo == 'peque-joven') { 

        if(total < 1000 && env < 15) {
            return first;
        } else {
            return second;
        }

    } else if (tipo == 'peque-enveje') {

        if(total < 1000 && (env >= 15 && env < 30)) {
            return first;
        } else {
            return second;
        }

    } else if (tipo == 'peque-muyenv') {

        if(total < 1000 && env >= 30) {
            return first;
        } else {
            return second;
        }

    } else if(tipo == 'medi-joven') { 

        if((total >= 1000 && total < 20000) && env < 15) {
            return first;
        } else {
            return second;
        }

    } else if (tipo == 'medi-enveje') {

        if((total >= 1000 && total < 20000) && (env >= 15 && env < 30)) {
            return first;
        } else {
            return second;
        }

    } else if (tipo == 'medi-muyenv') {

        if((total >= 1000 && total < 20000) && env >= 30) {
            return first;
        } else {
            return second;
        }

    } else if(tipo == 'grande-joven') { 

        if(total >= 20000 && env < 15) {
            return first;
        } else {
            return second;
        }

    } else if (tipo == 'grande-enveje') {

        if(total >= 20000 && (env >= 15 && env < 30)) {
            return first;
        } else {
            return second;
        }

    } else if (tipo == 'grande-muyenv') {

        if(total >= 20000 && env >= 30) {
            return first;
        } else {
            return second;
        }

    }
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