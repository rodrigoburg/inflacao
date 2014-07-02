#função normalizadora auxiliar para ser usada no processo calcula_tudo()
preparaExportacao = function (final) {
  row.names(dados) = dados$codigo
  dados$codigo = NULL
  saida = data.frame(data=character(0),variavel=character(0),valor=numeric(0),peso=numeric(0))
  for(i in row.names(codigo)) {
    print(i)
  }
}

calcula_acumulado = function (dados) {
  dados$acumulado_1994 = 100
  nomes = {}
  nomes[1] = "X1994"
  nomes = append(nomes,names(dados)[7:26])
  nomes = as.numeric(gsub("X","",nomes))
  
  #cria as colunas acumulado_1995 e por aí vai, com o acumulado até então
  for (coluna in seq(1,length(nomes))) {
    if (nomes[coluna] != 1994) {
      coluna_atual = paste("acumulado",nomes[coluna],sep="_")
      coluna_anterior = paste("acumulado",nomes[coluna-1],sep="_")
      coluna_valor= paste("X",nomes[coluna],sep="")    
      dados[[coluna_atual]] = dados[[coluna_anterior]]*(1+(dados[[coluna_valor]]/100))
    }
  }
  
  #retira o valor do IPCA dessas colunas 
  for (coluna in seq(1,length(nomes))) {
    if (nomes[coluna] != 1994) {      
      coluna_atual = paste("acumulado",nomes[coluna],sep="_")
      variacao_ipca = dados[dados$codigo == "0",][[coluna_atual]]
      dados[[coluna_atual]] = (dados[[coluna_atual]]-variacao_ipca)/variacao_ipca      
    }
  }
  return(dados)
}