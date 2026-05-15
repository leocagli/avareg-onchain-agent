# Demo Script

0:00 - Instruments regulated by CNV-style workflows cannot move like ordinary tokens. They require identity, role validation, limits and audit evidence.

0:20 - The issuer registers `Bono AVAX 2027` with KYC level 2, Argentina jurisdiction, lock-up and max holding rules.

0:45 - Compliance approves Investor A and assigns institutional roles to Issuer, TRD Entity and simulated PSAV.

1:10 - Investor A subscribes in primary distribution using mock USDC. The regulated instrument is minted.

1:35 - Investor A attempts a secondary transfer to Investor B. The transfer is blocked with `RECEIVER_NOT_VERIFIED`.

2:00 - Compliance approves Investor B. Investor A retries through the secondary workflow and settlement succeeds.

2:25 - Close: Fuji C-Chain is the MVP path; a permissioned Avalanche L1 is the institutional production path.
