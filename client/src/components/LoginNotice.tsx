import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export function LoginNotice({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#071d41]">
            <AlertTriangle className="h-5 w-5 text-[#ffcd07]" />
            Aviso Importante
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-6 text-slate-700">
          <p>
            Município fictício de Santa Vitória–SP, com aproximadamente 60.000 habitantes, dividido em bairros,
            com rede SUS e privada, hospital, UPA, unidades de saúde, laboratórios, rodovias, ferrovia e
            diferentes áreas urbanas.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Possui 18 ACEs concursados em atividade no momento, todos treinados há mais de 2 anos, porém 3 destes funcionários estão atuando no momento em serviços administrativos, indicados pela antiga gestão municipal.</li>
            <li>Há 2 vans para transporte dos funcionários e um carro de passeio para transporte de equipamentos.</li>
            <li>Todos os colaboradores recebem EPI.</li>
            <li>Não possui nenhum reumatologista disponível para atendimento em nenhuma unidade de saúde.</li>
            <li>Não possui estoque de medicamentos ou soro para hidratação.</li>
            <li>Não possui sala de hidratação instalada em nenhuma unidade de saúde.</li>
            <li>Não faz o preenchimento da tabela de Plano de Contingência Municipal.</li>
            <li>A VISA municipal nunca utilizou o Formulário de Inspeção em Arboviroses.</li>
            <li>Não há fluxo ou Canal oficial de denúncias estabelecido no município quanto às queixas pertinentes à Vigilância Sanitária.</li>
            <li>Não comparece à todas as salas de Situação Regionais de Arboviroses, por falta de carro para transporte dos funcionários da Vigilância Epidemiológica.</li>
            <li>O novo responsável pela Vigilância Epidemiológica assumiu o cargo à 3 meses, não possuindo acesso à nenhum documento e nem planilhas de monitoramento municipais, bem como nos 3 meses passados não monitorou a digitação de fichas no SINAN, estando os dados municipais oficiais desatualizados.</li>
          </ul>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={onClose} className="rounded-sm bg-[#1351b4] px-6 text-white hover:bg-[#0e3d8a]">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
