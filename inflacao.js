window.variacoes = null
window.data = null
window.charts = []
window.congelado = false
window.subgrupo = "tudo"

function inicializa() {
    
    var comprimento = 1200
    var altura = 800
    var ultima_data = "05-2014"
    var svg = dimple.newSvg("#grafico_inflacao", comprimento, altura);
    d3.csv("dados/ipca_pronto.csv", function (data) {
        window.data = data
      //variáveis de posição
      var posicao_y = 0,
          posicao_x = 0,
          top = 30,
          left = 120
          margem_x = 320,
          margem_y = 180,
          width = 150,
          height = 90

      //pega cada um dos recortes
      var recortes = dimple.getUniqueValues(data, "variavel");

      //acha a distância média no eixo X para cada peso
      var pesos = dimple.getUniqueValues(data, "peso");
      pesos.sort(function(a, b){return b-a});
      var x_max = pesos[0]
      var x_min = pesos[pesos.length-1]
      
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
          posicao_x = left+achaPosicaoX(comprimento-margem_x,
              x_min,
              x_max,
              data_filtrado[0].peso)
              
          posicao_y = top+achaPosicaoY(altura-margem_y,
              y_min,
              y_max,
              data_filtrado[data_filtrado.length-1].valor)
    
          //desenha o gráfico
          var grafico = desenhaGrafico(svg,data_filtrado,posicao_x,posicao_y,width,height)

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
function desenhaGrafico (svg,data,posicao_x,posicao_y,width,height) {
    var myChart = new dimple.chart(svg, data);
    myChart.setBounds(posicao_x, posicao_y, width, height);

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
    s.lineWeight = 1;

    myChart.defaultColors = achaCor(data)
    
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

function achaCor (data) {
    var grupo = data[0]["subgrupo"]
    var cores = {
        "Alimentação no domicílio":"#595926",
        "Alimentação fora do domicílio":"#594026",
        "Aparelhos elétricos e não-elétricos":"#592626",
        "Atendimento e serviços":"#592640",
        "Calçados e acessórios":"#592659",
        "Combustíveis e energia":"#402659",
        "Cuidados pessoais":"#262659",
        "Encargos e manutenção":"#265959",
        "Joias e relógio de pulso":"#265940",
        "Móveis e utensílios":"#265926",
        "Produtos farmacêuticos. óculos e lentes":"#405926",
        "Recreação e fumo":"#598F7D",
        "Roupas":"#597D8F",
        "Serviços":"#8F598F",
        "Tecidos e armarinho":"#8F7D59",
        "Transporte":"#8FA3B8"
    }
    cor = new dimple.color(cores[grupo])
    return([cor])
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
  //acha o delta y
  var variacao_y = Math.abs(y_min) + Math.abs(y_max)
  //faz todos os ultimo_valors ficarem positivos
  ultimo_valor = parseFloat(ultimo_valor) + Math.abs(y_min)
  //regra de três pra achar a posição
  posicao_y = altura*ultimo_valor/variacao_y
  //inverte a posição e o sinal dela
  posicao_y = posicao_y - altura
  posicao_y = posicao_y * -1
  return posicao_y
}

function achaPosicaoX (largura,x_min,x_max,peso) {
  //acha o delta x
  var variacao_x = Math.abs(x_min) + Math.abs(x_max)
  //faz todos os pesos ficarem positivos
  peso = parseFloat(peso) + Math.abs(x_min)
  //regra de três pra achar a posição
  posicao_x = largura*peso/variacao_x
  //inverte a posição e o sinal dela
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
          jQuery(this).attr("stroke-width","3")
      } 
  })
}

function escondeCurva(evento) {
    jQuery(evento).attr("opacity",0.2)
    jQuery(evento).attr("stroke-width","0.5")
}

function escondeOutrasCurvas(evento, subgrupo_selecionado) {
    var variavel = evento.id.split("_")[0]
    var data = window.data
    //coloca todos os outros gráficos sem destaque
    jQuery("path").each(function() {
      if (this.id != variavel) {
          if (window.congelado == false) {
              jQuery(this).attr("opacity",0.2)
              jQuery(this).attr("stroke-width","0.5")              
          } else {
              var subgrupo = data.filter(function (a) { return a["variavel"] == variavel})[0]["subgrupo"]
              if (subgrupo != subgrupo_selecionado) {
                  jQuery(this).attr("opacity",0.2)
                  jQuery(this).attr("stroke-width","0.5")              
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
          jQuery(this).attr("stroke-width","1")
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
