window.variacoes = null
window.data = null
window.charts = []
window.congelado = false
window.subgrupo = "tudo"

function inicializa() {
    
    var comprimento = "100%"
    var altura = "100%"
    var ultima_data = "05-2014"
    var svg = dimple.newSvg("#grafico_inflacao", comprimento, altura);
    d3.csv("dados/ipca_pronto.csv", function (data) {
        //transforma altura e comprimento em pontos
        comprimento = jQuery("#grafico_inflacao").width()
        altura = jQuery("#grafico_inflacao").height()
        
        window.data = data
      //variáveis de posição
      var posicao_y = 0,
          posicao_x = 0,
          left = comprimento*0.1,
          top = altura*0.05,
          margem_x = comprimento*0.3,
          margem_y = altura*0.2,
          tamanho_x = 150,
          tamanho_y = 40

      //pega cada um dos recortes
      var recortes = dimple.getUniqueValues(data, "variavel");

      //acha a distância média no eixo X para cada peso
      var pesos = dimple.getUniqueValues(data, "peso");
      pesos.sort(function(a, b){return b-a});
      var x_max = pesos[0]
      var x_min = pesos[pesos.length-1]
      var num_x = pesos.length

      
      //acha o máximo e o mínimo do eixo Y
      max_min_y = achaMaxMin(recortes,data,ultima_data)
      var y_min = max_min_y[0]
      var y_max = max_min_y[1]
      
      // desenha um gráfico para cada um dos recortes
      charts = []
      recortes.forEach(function (recorte) {
          //filtra o dado
          data_filtrado = dimple.filterData(data,"variavel",recorte);
    
          //acha as posições
          var peso = data_filtrado[0].peso
        var pos_x = pesos.indexOf(peso)
          var posicao_x = left+achaPosicaoX(comprimento-margem_x,
              x_min,
              x_max,
              peso,
              pos_x,
              num_x)
            
          var ultimo_y = data_filtrado[data_filtrado.length-1].valor
          posicao_y = top+achaPosicaoY(altura-margem_y,
              y_min,
              y_max,
              ultimo_y)
    
          //acha cor
          cor = achaCor(y_min,y_max,ultimo_y)         

          //desenha o gráfico
          var grafico = desenhaGrafico(svg,data_filtrado,posicao_x,posicao_y,tamanho_x,tamanho_y,cor)

          var item = {}
          item["recorte"] = recorte
          item["grafico"] = grafico
          charts.push(item)
          
    }, this);
    window.charts = charts

    //desenha um gráfico grande para servir de referência
    var novo_data = []
    var i = 0
    //só divide os dados: metade é o valor máximo, metade o mínimo
    //isso é necessário para que o eixo X fique no meio
    data_filtrado.forEach(function (dado){
        if (i == 0) {
            dado.peso = 1
            i = 1
        } else {
            dado.peso = -1
            i = 0
        }
    novo_data.push(dado)            
    },this)
    var bigChart = new dimple.chart(svg, novo_data);
    var y_grande = bigChart.addPctAxis("y","peso")
    y_grande.overrideMax = 1
    y_grande.overridemin = -1
    y_grande.title = "Variação final do preço"
    y_grande.ticks = 2
    var x_grande = bigChart.addMeasureAxis("x","data")
    x_grande.title = "Peso do produto no IPCA"
    bigChart.draw()
    y_grande.shapes.selectAll("text").remove();
    
  });
}

function desenhaGrafico (svg,data,posicao_x,posicao_y,tamanho_x,tamanho_y, cor) {
    var myChart = new dimple.chart(svg, data);
    myChart.setBounds(posicao_x, posicao_y, tamanho_x, tamanho_y);

    //cria os eixos e os esconde
    var x = myChart.addTimeAxis("x", "data","%m-%Y","%Y");
    x.title = ""
    x.timePeriod = d3.time.years;
    x.timeInterval = 2;
    
    var y = myChart.addMeasureAxis("y", "valor");
    y.title = "Variação no preço"
    y.tickFormat = "%"
    y.ticks = 4
    var s = myChart.addSeries("variavel", dimple.plot.line);
    s.lineWeight = 1.2;
    s.interpolation = "cardinal";

    myChart.defaultColors = cor
    
    myChart.draw();


    //esconde os eixos
    jQuery(".dimple-axis").hide()
    jQuery(".dimple-gridline").hide()


    //coloca evento mouseover para mostrar os eixos e dar highlight
    //retira também
    s.shapes
        .on("mouseover", function (e) { mouseCima(e,this) })
        .on("mouseout", function (e) { mouseFora(e,this) })

    //faz o mesmo para os círculos, além de colocar e tirar a tooltip
    d3.selectAll("circle")
        .on("mouseover", function (e) { mouseCima(e,this) })
        .on("mouseleave",function(e) { mouseFora(e,this) })       

    return myChart

}

function achaCor (y_min,y_max,valor) {
    var cor = null
    if (valor > 0) {
        divisoes = y_max/3
        if (valor < divisoes) {
            cor = "#E68B29"
        } else if (valor <divisoes*2) {
            cor = '#DE6C3C'
        } else {
            cor = "#BA0C09"
        }
    } else { //se o valor for negativo
        divisoes = y_min/3
        if (valor > divisoes) {
            cor = "#B3C418"
        } else if (valor > divisoes*2) {
            cor = "#7FC418"
        } else {
            cor = "#05800F"
        } 
    } 
    cor = new dimple.color(cor)
    return([cor])
}

function achaGradiente (numberOfItems) {
    var rainbow = new Rainbow(); 
    rainbow.setNumberRange(1, numberOfItems);
    rainbow.setSpectrum('red', 'green');
    var s = []
    for (var i = 1; i <= numberOfItems; i++) {
        var hexColour = rainbow.colourAt(i);
        s.push('#' + hexColour)
    }
    return s; 
}

function achaGrafico (evento) {
    var variavel = evento.id.split("_")[0]
    var charts = window.charts
    var grafico = null
    charts.forEach(function (chart) {
        if (chart.recorte == variavel) {
            grafico = chart.grafico
        }
    },this)
    return grafico        
}

function achaPosicaoY (altura,y_min,y_max,ultimo_valor) {
    ultimo_valor = parseFloat(ultimo_valor)
    //acha posição para a primeira metade do gráfico (y positivo)
    if (ultimo_valor > 0) {
        posicao_y = (-1*(altura/2))*ultimo_valor/y_max
        posicao_y = altura/2 + posicao_y
    } else { //agora o mesmo para os y negativos
        posicao_y = (altura/2)*ultimo_valor/y_min
        posicao_y = posicao_y + altura/2
    }
    return posicao_y
}

function achaPosicaoX (largura,x_min,x_max,peso,pos_x,num_x) {
  //acha o delta x
  var variacao_x = Math.abs(x_min) + Math.abs(x_max)
  peso = parseFloat(peso)
  var distancia_media = largura/num_x
  //regra de três pra achar a posição
//  posicao_x = largura*peso/variacao_x
  posicao_x = distancia_media*pos_x
  posicao_x = posicao_x-largura
  posicao_x = posicao_x*(-1)
  return posicao_x
}

function achaMaxMin(recortes,data,ultima_data) {
  //acha o máximo e o mínimo do acumulado de todos os recortes
  var variacoes = []
  recortes.forEach(function (recorte) {
      data_filtrado = dimple.filterData(data,"variavel",recorte)
      data_filtrado.forEach(function (dado) {
          if (dado.data == ultima_data) {
              variacoes.push(parseFloat(dado.valor))
          }
      },this)
  } ,this)
  variacoes.sort(function (a,b) { return a - b})
  return [variacoes[0],variacoes[variacoes.length-1]]
}

function mouseCima (e,evento) {
    var elemento = jQuery(evento).prop("tagName")
    var data = window.data
    var variavel = evento.id.split("_")[0]
    var subgrupo = data.filter(function (a) { return a["variavel"] == variavel})[0]["subgrupo"]
    if ((window.congelado == false) || (window.subgrupo == subgrupo)) {
        mostraEixos(evento)
        destacaCurva(evento)
        escondeOutrasCurvas(evento,subgrupo)    
        if (elemento == "circle") {
            var grafico = achaGrafico(evento)
            dimple._showPointTooltip(e, evento, grafico, grafico.series[0])
        }
    }
}

function mouseFora (e,evento) {
    var elemento = jQuery(evento).prop("tagName")
    escondeEixos(evento)
    if (elemento == "circle") {
        var grafico = achaGrafico(evento)
        dimple._removeTooltip(e, evento, grafico, grafico.series[0])        
    }
}

function mostraEixos(evento) {
    var variavel = evento.id.split("_")[0]
    //mostra os eixos do gráfico atual
    jQuery("path").each(function () {                
        if (this.id == variavel) {
        jQuery(this).prevAll().slice(0,9).show()                    
      }                
  })
}

function destacaCurva(evento) {
    var variavel = evento.id.split("_")[0]
  //dá destaque para o gráfico em questão e coloca todos os outros com menor opacidade
  jQuery("path").each(function() {
      if (this.id == variavel) {
          jQuery(this).attr("opacity",1)
          jQuery(this).attr("stroke-tamanho_x","3")
      } 
  })
}

function escondeCurva(evento) {
    jQuery(evento).attr("opacity",0.2)
    jQuery(evento).attr("stroke-tamanho_x","0.5")
}

function escondeOutrasCurvas(evento, subgrupo_selecionado) {
    var variavel = evento.id.split("_")[0]
    var data = window.data
    //coloca todos os outros gráficos sem destaque
    jQuery("path").each(function() {
      if (this.id != variavel) {
          if (window.congelado == false) {
              jQuery(this).attr("opacity",0.2)
              jQuery(this).attr("stroke-tamanho_x","0.5")              
          } else {
              var subgrupo = data.filter(function (a) { return a["variavel"] == variavel})[0]["subgrupo"]
              if (subgrupo != subgrupo_selecionado) {
                  jQuery(this).attr("opacity",0.2)
                  jQuery(this).attr("stroke-tamanho_x","0.5")              
              }              
          }
      } 
  })
}

function escondeEixos(evento) { 
  var variavel = evento.id.split("_")[0]
  jQuery("path").each(function () {  
      if (window.congelado == false) {    
          jQuery(this).attr("opacity",1)
          jQuery(this).attr("stroke-tamanho_x","1")
      }
      if (this.id == variavel) {
          jQuery(this).prevAll().slice(0,9).hide()
      }                
  })
}

function voltaNormal() {
    escondeEixos(jQuery("path")[0])
}

function mudaGrupo() {
    var grupo = jQuery("#select-grupo").val()
    if (grupo == "tudo") {
        window.congelado = false
        window.subgrupo = grupo
        voltaNormal()
    } else {
    var data = window.data
    var data_filtrado = data.filter(function (a) { return a["subgrupo"] == grupo})
    var subitens = dimple.getUniqueValues(data_filtrado,"variavel")
    jQuery("path").each(function() {
        if (subitens.indexOf(this.id) > -1) {
            destacaCurva(this)
        } else {
            escondeCurva(this)
        }
    })
    window.congelado = true
    window.subgrupo = grupo
    
  }
}    
