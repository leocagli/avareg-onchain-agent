# Sprint Phases

## Sprint 0 - Framing

Freeze the product as an On-Chain Agent, not a generic tokenization protocol. Demo scope is Argentina ON, Mexico IFC, Wavy risk gate, referral transaction and secondary allow/block.

Acceptance:

- Country adapters are explicit.
- No custody, brokerage or public offering claims.
- Fuji C-Chain is the target network.

## Sprint 1 - Contracts Foundation

Implement investor, institution, product and referral registries.

Acceptance:

- Investors have country, suitability hash, KYC and active status.
- Institutions have type, country, registry hash and active status.
- Products map country, type, document hash and responsible institution.

## Sprint 2 - Compliance And Risk

Implement Wavy API path, `RiskOracle` and `OnChainAgentCompliance`.

Acceptance:

- Wavy score returns allow/review/block.
- Suspicious activity blocks automatically.
- Compliance returns reason codes useful in the UI.
- API key remains server-side.
- Wavy webhooks and user-data endpoint verify HMAC signatures.

## Sprint 3 - Product Templates

Seed Argentina ON and Mexico IFC templates.

Acceptance:

- Argentina routes to simulated ALyC/PSAV.
- Mexico routes to simulated IFC / Arkangeles-style institution.
- Product rules differ by country.

## Sprint 4 - B2C Frontend

Build the user journey: marketplace, profile, Wavy check, eligibility and referral status.

Acceptance:

- User can select Argentina or Mexico.
- Risk score is visible.
- Referral shows transaction hash placeholder or real Fuji hash.

## Sprint 5 - Secondary Transfer

Demonstrate permissioned transfer validation.

Acceptance:

- Clean buyer is allowed.
- Risky or suspicious buyer is blocked.
- Dashboard records both decisions.

## Sprint 6 - Demo Hardening

Finalize README, submission checklist, screenshots, demo script and Fuji deploy addresses.

Acceptance:

- Demo can be shown in under 3 minutes.
- Wavy API credentials, screenshots and any unsupported-chain constraints are clearly disclosed.
- Limitations are visible and precise.
