#transforma o dataframe com colunas em um estilo data-variável-valor
preparaExportacao = function (dados) {
  dados$subgrupo = as.character(dados$subgrupo)
  dados$acumulado_1994 = 0
  #cria df vazio para resultado e contador para adicionar linha a linha
  saida = data.frame(data=character(0),variavel=character(0),valor=numeric(0),peso=numeric(0),subgrupo=character(0),stringsAsFactors=FALSE)
  contador = 0
  for(i in row.names(dados)) { #para cada linha do dataframe
    if (dados[i,"subitem"] > 0) { #só pega os subitens
      nome = as.character(dados[i,"nome"]) #pega o nome da variável
      peso = as.numeric(dados[i,"peso"])
      for (j in names(dados)) { #para cada coluna
        if (grepl("acumulado",j)) { #ignora as colunas que não são de valores (acumulado)
            contador = contador + 1
            if (grepl("2014",j)) { #se for em 2014, o mês é maio
              mes = gsub("acumulado_","05-",j)
            } else {
              mes = gsub("acumulado_","12-",j)
            }
            nova_linha = c(mes,nome,round(dados[i,j],digits=3),peso,dados[i,"subgrupo"])
            saida[contador,] = nova_linha          
        }
      }      
    }
  }
  return(saida)
}
  
calcula_acumulado = function (dados) {
  dados$acumulado_1994 = 100
  nomes = {}
  nomes[1] = "X1994"
  nomes = append(nomes,names(dados)[8:27])
  nomes = as.numeric(gsub("X","",nomes))
  
  #cria as colunas acumulado_1995 e por aí vai, com o acumulado até então
  for (coluna in seq(1,length(nomes))) {
    if (nomes[coluna] != 1994) {
      coluna_atual = paste("acumulado",nomes[coluna],sep="_")
      coluna_anterior = paste("acumulado",nomes[coluna-1],sep="_")
      coluna_valor= paste("X",nomes[coluna],sep="")    
      dados[[coluna_valor]] = as.numeric(dados[[coluna_valor]])
      dados[[coluna_atual]] = dados[[coluna_anterior]]*(1+(dados[[coluna_valor]]/100))
    }
  }
  
  #retira o valor do IPCA dessas colunas 
  for (coluna in seq(1,length(nomes))) {
    if (nomes[coluna] != 1994) {
      #deleta a coluna com X
      dados[[paste("X",nomes[coluna],sep="")]] = NULL
      coluna_atual = paste("acumulado",nomes[coluna],sep="_")
      variacao_ipca = dados[dados$codigo == "0",][[coluna_atual]]
      dados[[coluna_atual]] = (dados[[coluna_atual]]-variacao_ipca)/variacao_ipca      
    }
  }
  return(dados)
}

########################
#como usar o script
dados = read.csv("ipca_tabelao.csv")
dados = calcula_acumulado(dados)
saida = preparaExportacao(dados)
write.csv(saida,"ipca_pronto.csv",row.names=FALSE)