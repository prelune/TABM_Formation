import React from 'react';
import { 
  ShieldCheck, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  BookOpen, 
  FileText
} from 'lucide-react';

interface DataRgpdGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataRgpdGuideModal: React.FC<DataRgpdGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const downloadChecklist = () => {
    const textContent = `CHECKLIST CONFORMITÉ RGPD - FORMATION TABM (RH & FORMATION PROFESSIONNELLE)
Date de génération : ${new Date().toLocaleDateString('fr-FR')}

1. IDENTIFICATION DU TRAITEMENT
- Nom de l'application : Formation TABM
- Responsable de traitement : Direction des Ressources Humaines / Employeur
- Finalité principale : Organisation, suivi logistique, financier (OPCO) et légal des actions de formation professionnelle continue.
- Base légale (Art. 6 RGPD) : Obligation légale de l'employeur (Code du travail L. 6321-1) et Exécution du contrat de travail (Art. 6.1.b & 6.1.c). Pas de consentement préalable nécessaire.

2. DONNÉES COLLECTÉES (PRINCIPE DE MINIMISATION)
[✓] Nom, Prénom, Matricule interne
[✓] Adresse email professionnelle
[✓] Département / Service et Intitulé du poste
[✓] Historique des formations suivies, présences et émargements
[✓] Recyclages réglementaires (SST, CACES, Habilitations électriques)
[✓] Évaluations de satisfaction à chaud et à froid (3 mois)
[!] INTERDICTION FORMELLE : Aucune donnée de santé (NIR, dossier médical), donnée d'infraction ou donnée sensible (opinions syndicales, religion) dans cet outil.

3. DURÉES DE CONSERVATION LÉGALES
- Feuilles d'émargement et convocations : 5 ans (prescription prud'homale de droit commun).
- Dossiers de prise en charge OPCO et factures : 10 ans (justificatifs comptables et contrôles de l'État).
- Passeport formation / Habilitations : Toute la durée de présence du salarié dans l'effectif de l'entreprise.

4. SÉCURITÉ ET CONFIDENTIALITÉ
- Accès restreint au seul personnel RH et responsables hiérarchiques habilités.
- Confidentialité stricte des évaluations individuelles.

5. DROITS DES SALARIÉS
- Droit d'accès et de rectification (Art. 15 et 16 du RGPD) : Fourniture au salarié de son relevé individuel de formation sur simple demande.
- Information préalable des salariés lors du recueil des souhaits de formation.
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Checklist_RGPD_Formation_TABM_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shadow-blue-600/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  Réglementation CNIL & Code du Travail
                </span>
                <span className="text-xs text-stone-400">• Formation TABM</span>
              </div>
              <h2 className="text-base font-bold text-stone-900 mt-0.5">
                Guide de Conformité RGPD (Formation Professionnelle)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            title="Fermer le guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto text-xs text-stone-700 leading-relaxed">
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
            <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-700" />
              <span>Le RGPD appliqué aux données de formation RH</span>
            </h3>
            <p className="text-stone-600">
              Toute gestion de la formation manipule des <strong>données à caractère personnel</strong> des salariés. Voici les principes clés et obligations juridiques à respecter pour être en conformité avec la CNIL et le Code du travail.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* 1. Base légale */}
            <div className="border border-stone-200 bg-white rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>1. Base Légale : Avez-vous besoin du consentement des salariés ?</span>
              </h4>
              <p className="text-stone-600">
                <strong>Non, aucun consentement n'est requis !</strong> L'employeur est légalement tenu d'assurer l'adaptation des salariés à leur poste de travail et de veiller au maintien de leur capacité à occuper un emploi (<strong>Article L. 6321-1 du Code du travail</strong>).
              </p>
              <p className="text-stone-600">
                Le traitement repose sur <strong>l'Obligation Légale de l'employeur</strong> (Article 6.1.c du RGPD) et <strong>l'Exécution du contrat de travail</strong> (Article 6.1.b). Vous n'avez pas besoin de faire signer d'accord préalable.
              </p>
            </div>

            {/* 2. Minimisation */}
            <div className="border border-stone-200 bg-white rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>2. Principe de Minimisation (Quelles données enregistrer ?)</span>
              </h4>
              <p className="text-stone-600">
                Dans <strong>Formation TABM</strong>, nous enregistrons uniquement les données strictement nécessaires : Nom, Prénom, Matricule, Email pro, Service, Intitulé du poste et historique des formations / présences.
              </p>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Données strictement interdites :</strong> N'ajoutez jamais de données médicales, d'adresses personnelles, ou de numéro de sécurité sociale (NIR) dans cet outil de gestion de formation.
                </span>
              </div>
            </div>

            {/* 3. Durées de conservation */}
            <div className="border border-stone-200 bg-white rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>3. Durée de Conservation des Données de Formation</span>
              </h4>
              <ul className="space-y-1.5 text-stone-600 list-disc pl-4">
                <li>
                  <strong>Feuilles d'émargement & convocations :</strong> 5 ans (délai de prescription civile en droit du travail).
                </li>
                <li>
                  <strong>Dossiers financiers OPCO & factures de formation :</strong> 10 ans (justificatifs comptables et fiscaux exigés en cas de contrôle de l'administration).
                </li>
                <li>
                  <strong>Passeport de formation & Habilitations :</strong> Pendant toute la durée de présence du salarié dans l'effectif de l'entreprise.
                </li>
              </ul>
            </div>

            {/* 4. Droits des salariés */}
            <div className="border border-stone-200 bg-white rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>4. Droit d'accès et d'information du salarié</span>
              </h4>
              <p className="text-stone-600">
                Conformément aux Articles 15 et 16 du RGPD, chaque salarié dispose d'un droit d'accès et de rectification sur les formations enregistrées à son nom.
              </p>
              <p className="text-stone-600">
                Vous pouvez facilement lui remettre sa fiche individuelle ou son récapitulatif complet de formations sur simple demande.
              </p>
            </div>

            {/* 5. Sécurité et confidentialité */}
            <div className="border border-stone-200 bg-white rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>5. Confidentialité des Évaluations</span>
              </h4>
              <p className="text-stone-600">
                Les évaluations à chaud (satisfaction) et à froid (impact opérationnel) doivent rester strictement réservées à l'équipe RH et au management concerné afin d'assurer l'honnêteté des retours et la protection des collaborateurs.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Checklist Download */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={downloadChecklist}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger la Fiche Récapitulative RGPD (.txt)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            Fermer le Guide
          </button>
        </div>
      </div>
    </div>
  );
};
