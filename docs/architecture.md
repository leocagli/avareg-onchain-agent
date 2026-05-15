# Architecture

```text
Frontend B2C
  -> Marketplace: Argentina ON / Mexico IFC
  -> Investor profile and suitability hash
  -> Wallet risk check via Wavy adapter
  -> Eligibility result
  -> Referral status
  -> Secondary transfer request

Backend / API path
  -> Country rules engine
  -> Argentina adapter
  -> Mexico adapter
  -> Wavy Node API adapter
  -> Wavy integration endpoints: GET /users/{foreign_user_id}, POST /webhook
  -> Reporting API

Avalanche Fuji
  -> InvestorRegistry
  -> InstitutionRegistry
  -> ProductRegistry
  -> RiskOracle
  -> ReferralRegistry
  -> OnChainAgentCompliance
  -> TokenizedInstrument
  -> PermissionedTransfer
```

The MVP keeps legal execution, custody and final regulated decisions outside AvaReg. AvaReg records eligibility evidence, referral routing and transfer gate decisions.

## Wavy Node

The server calls Wavy Node with `x-api-key: ApiKey ...`, registers wallets under the configured project and then requests `scan-risk` results. The browser never receives the API key.

Incoming Wavy integration calls are authenticated with HMAC-SHA256 over the canonical message described in Wavy docs: method, lowercase path, sorted JSON body and timestamp.
