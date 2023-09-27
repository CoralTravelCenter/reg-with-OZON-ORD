import { find } from "lodash";

export function contractsAndAddendumsToSelectOptions(contract_list, organisation_list) {
    const ca = { contracts:[], addendums: [] };
    contract_list.forEach((contract) => {
        if (contract.contractType === 'CONTRACT_TYPE_ADDITIONAL_AGREEMENT') {
            // externalOrganisationCustomerId  => fullOpf
            // externalOrganisationPerformerId => fullOpf
            ca.addendums.push({
                externalContractId:           contract.externalContractId,
                additionalContractNumber:     contract.additionalContractNumber,
                additionalContractNumberDate: contract.additionalContractNumberDate,
                customerOrgName: find(organisation_list, { externalOrganisationId: contract.externalOrganisationCustomerId }).fullOpf,
                performerOrgName: find(organisation_list, { externalOrganisationId: contract.externalOrganisationPerformerId }).fullOpf,
            });
        } else {

        }
    });
}