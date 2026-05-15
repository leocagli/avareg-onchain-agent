# Avalanche L1 Migration Path

The MVP deploys to Avalanche Fuji C-Chain to keep the hackathon prototype simple and reproducible. A permissioned Avalanche L1 becomes justified when AvaReg needs institutional controls that are wider than smart contracts alone.

## Migration Stages

1. Validate the contracts on a local Avalanche L1 with custom chain ID and RPC.
2. Deploy an Avalanche L1 on Fuji and fund validator operations through the P-Chain flow.
3. Configure deployer and transactor allowlists where required.
4. Move critical governance to multisig and document validator onboarding.
5. Add ICM or Teleporter proof-of-concept if cross-chain messaging is required.
6. Add ICTT only if token movement between C-Chain and the AvaReg L1 is genuinely needed.
7. Prepare production runbooks for RPC, monitoring, indexers, backups, key management and incident response.

## Criteria

- Validators need KYC, AML, licensing or geographic restrictions.
- Only authorized wallets can transact or deploy.
- Sensitive activity should be visible only to approved infrastructure participants.
- Fee market, native token, throughput or EVM parameters need project-specific control.
