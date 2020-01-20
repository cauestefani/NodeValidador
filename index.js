const csv = require('csv-parser');
const fs = require('fs');
var rp = require('request-promise');
var dateFormat = require('dateformat');

fs.createReadStream('CDC.csv')
    .pipe(csv())
    .on('data', (row) => {
        var CPF = CompletaCPF(row);

        contrato = row.contrato;

        ValidaContrato(contrato);

    })
    .on('end', () => {
        console.log('CSV file successfully processed');
    });

function ValidaContrato(contrato) {

    var arrayContrato = new Array();

    rp(MontaURLContrato(contrato))
        .then(function (res) {

            var json = JSON.parse(res);

            if (json.parcelas != null & json.parcelas.length > 0) {

                ObtemContratosParaValidacao(json, arrayContrato, contrato);
            }
        })
        .catch(function (err) {
            console.log(err)
        });

}

function ValidaParcelasReplicadas(contrato, arrayContrato, dataVencimentoParcela) {

    data = ConverteDataValidaParcelas(dataVencimentoParcela);

    rp(MontaURLParcelasReplicadas(data))
        .then(function (res) {
            var jSon = JSON.parse(res);

            jSon.forEach(element => {
                var contratoAux = Number(contrato.toString().substring(6, 13));
                if (contratoAux == element.codigo_contrato) {
                    arrayContrato.pop();
                }
            });
            if (arrayContrato.length > 0)
                console.log(contrato + " array " + arrayContrato);
        })
        .catch(function (err) {
            console.log(err);
        });
}

function ObtemContratosParaValidacao(json, arrayContrato, contrato) {
    json.parcelas.forEach(element => {
        var dataVencimentoParcela;
        if (element.data_vencimento_ori != null) {
            dataVencimentoParcela = ConverteDataParaValidacao(element.data_vencimento_ori);
        }
        else {
            dataVencimentoParcela = ConverteDataParaValidacao(element.data_vencimento);
        }
        if (dataVencimentoParcela >= new Date("01/14/2020") &&
            dataVencimentoParcela <= new Date("01/22/2020") && element.status_parcela != "P") {
            arrayContrato.push(contrato);
            ValidaParcelasReplicadas(contrato, arrayContrato, dataVencimentoParcela);
        }
    });
}

function MontaURLContrato(contrato) {
    return "https://sit-cdccorp.viavarejo.com.br/contratos/" + contrato + "/parcelas";
}

function ConverteDataParaValidacao(data) {
    dataAux = data.toString().split(".")[1] + "/" +
        data.toString().split(".")[0] + "/" +
        data.toString().split(".")[2];

    return new Date(dataAux);
}

function MontaURLParcelasReplicadas(data) {
    return "https://sit-cdccorp.viavarejo.com.br/contratos/parcelas?data_inicio=" +
        data + "&data_fim=" + data;
}

function ConverteDataValidaParcelas(data) {
    dataAux = data.toString().split("/")[1] + "." +
        data.toString().split("/")[0] + "." +
        data.toString().split("/")[2];

    return dataAux;
}

function MontaUrlParcelas(CPF) {
    var requestUrl = "https://sit-cdccorp.viavarejo.com.br/v1/parcelas/";
    var data = ObtemData();
    requestUrl = requestUrl + CPF + "/" + data;

    return requestUrl;
}

function ObtemData() {
    var dataAtual = new Date();
    dataAtual.setHours(dataAtual.getHours() + 24);
    var data = dateFormat(dataAtual, "dd.mm.yyyy");
    return data;
}

function CompletaCPF(row) {
    var CPF;
    var zerosEsquerda = "";
    if (row.CPF.length < 11)
        for (i = 0; i <= (11 - row.CPF.length); i++)
            zerosEsquerda = zerosEsquerda + "0";

    CPF = zerosEsquerda + row.CPF;
    return CPF;
}
function ForcaReplicacao(CPF) {

    rp(MontaUrlParcelas(CPF))
        .then(function (res) {
            console.log(CPF + " sucesso!")
        })
        .catch(function (err) {
            console.log(CPF + " erro!")
        });
}
