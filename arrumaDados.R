#função normalizadora auxiliar para ser usada no processo calcula_tudo()
preparaExportacao = function (final) {
  peso = 1
  saida = data.frame(data=character(0),variavel=character(0),valor=numeric(0),peso=numeric(0))
  for (i in names(final)) {
    for (j in row.names(final)) {
      if (i != "data") {
        nova_linha = data.frame(data=as.character(final$data[as.numeric(j)]),variavel=i,valor=final[j,i],peso=peso)
        saida = rbind(saida,nova_linha)
      }
    }
    peso = peso+1
  }
  return(saida)
}

