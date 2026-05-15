# CNV-Aware Role Model

This MVP models regulated participation as explicit on-chain roles:

- `ISSUER`: creates or sponsors the instrument.
- `TRD_ENTITY`: simulated technical registry entity.
- `PSAV`: simulated distribution or settlement platform.
- `ALYC`, `AN`, `AAGI`, `CUSTODIAN`: institutional roles prepared for later workflows.
- `AP`: commercial referral role only. It cannot custody funds, execute orders, settle transactions or manage portfolios in this MVP.
- `COMPLIANCE_OFFICER`: intended operator for KYC and restrictions in a production admin layer.
- `AUDITOR`: read-oriented role for audit dashboards and exports.

Wallet KYC stores only minimum claims: level, jurisdiction, investor type, expiry and `dataHash`. Personal data must remain off-chain.
