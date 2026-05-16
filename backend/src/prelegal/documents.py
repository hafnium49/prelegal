import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel

FieldType = Literal["text", "long_text", "date", "number", "choice"]


class DocumentField(BaseModel):
    key: str
    label: str
    hint: str = ""
    type: FieldType = "text"
    choices: list[str] | None = None
    required: bool = True


class DocumentSpec(BaseModel):
    id: str
    name: str
    description: str
    filename: str
    source_url: str
    fields: list[DocumentField]
    party_roles: list[str] = ["Party 1", "Party 2"]


def _catalog_path() -> Path:
    container = Path("/app/catalog.json")
    if container.is_file():
        return container
    return Path(__file__).resolve().parents[3] / "catalog.json"


@lru_cache(maxsize=1)
def _catalog_by_filename() -> dict[str, dict]:
    with open(_catalog_path()) as f:
        data = json.load(f)
    return {entry["filename"]: entry for entry in data["templates"]}


def _spec(
    id: str,
    filename: str,
    fields: list[DocumentField],
    party_roles: list[str] | None = None,
) -> DocumentSpec:
    entry = _catalog_by_filename()[filename]
    return DocumentSpec(
        id=id,
        name=entry["name"],
        description=entry["description"],
        filename=filename,
        source_url=entry["source_url"],
        fields=fields,
        party_roles=party_roles or ["Party 1", "Party 2"],
    )


def _common_jurisdiction_fields() -> list[DocumentField]:
    return [
        DocumentField(
            key="effectiveDate",
            label="Effective Date",
            hint="When this agreement takes effect (YYYY-MM-DD)",
            type="date",
        ),
        DocumentField(
            key="governingLaw",
            label="Governing Law",
            hint="US state whose laws govern this agreement",
        ),
        DocumentField(
            key="jurisdiction",
            label="Jurisdiction",
            hint="City/county and state for legal proceedings",
        ),
    ]


DOCUMENT_SPECS: dict[str, DocumentSpec] = {
    "mutual_nda": _spec(
        id="mutual_nda",
        filename="Mutual-NDA-coverpage.md",
        fields=[
            DocumentField(
                key="purpose",
                label="Purpose",
                hint="How Confidential Information may be used",
                type="long_text",
            ),
            *_common_jurisdiction_fields(),
            DocumentField(
                key="termKind",
                label="MNDA Term",
                hint="Does the agreement expire after N years, or continue until terminated?",
                type="choice",
                choices=["years", "until_terminated"],
            ),
            DocumentField(
                key="termYears",
                label="Term length (years)",
                type="number",
                required=False,
            ),
            DocumentField(
                key="confidentialityKind",
                label="Confidentiality Term",
                hint="Time-bounded or in perpetuity?",
                type="choice",
                choices=["years", "perpetual"],
            ),
            DocumentField(
                key="confidentialityYears",
                label="Confidentiality length (years)",
                type="number",
                required=False,
            ),
            DocumentField(
                key="modifications",
                label="Modifications",
                hint="Any custom modifications to the Standard Terms",
                type="long_text",
                required=False,
            ),
        ],
    ),
    "mutual_nda_standard_terms": _spec(
        id="mutual_nda_standard_terms",
        filename="Mutual-NDA.md",
        fields=_common_jurisdiction_fields(),
    ),
    "pilot_agreement": _spec(
        id="pilot_agreement",
        filename="Pilot-Agreement.md",
        fields=[
            DocumentField(
                key="productDescription",
                label="Product",
                hint="What is being piloted",
                type="long_text",
            ),
            DocumentField(
                key="pilotPeriod",
                label="Pilot Period",
                hint="How long the pilot runs",
            ),
            DocumentField(
                key="fees",
                label="Fees",
                hint="Any fees during the pilot, or 'free of charge'",
                required=False,
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Provider", "Customer"],
    ),
    "design_partner_agreement": _spec(
        id="design_partner_agreement",
        filename="design-partner-agreement.md",
        fields=[
            DocumentField(
                key="productDescription",
                label="Product",
                hint="What is being designed together",
                type="long_text",
            ),
            DocumentField(
                key="partnershipPeriod",
                label="Partnership Period",
                hint="How long the design partnership lasts",
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Provider", "Design Partner"],
    ),
    "partnership_agreement": _spec(
        id="partnership_agreement",
        filename="Partnership-Agreement.md",
        fields=[
            DocumentField(
                key="partnershipType",
                label="Partnership Type",
                hint="Referral, reseller, or channel partnership",
                type="choice",
                choices=["referral", "reseller", "channel"],
            ),
            DocumentField(
                key="scope",
                label="Partnership Scope",
                hint="What activities the partnership covers",
                type="long_text",
            ),
            DocumentField(
                key="fees",
                label="Fees and Commissions",
                type="long_text",
                required=False,
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Provider", "Partner"],
    ),
    "software_license_agreement": _spec(
        id="software_license_agreement",
        filename="Software-License-Agreement.md",
        fields=[
            DocumentField(
                key="productDescription",
                label="Licensed Software",
                hint="What software is being licensed",
                type="long_text",
            ),
            DocumentField(
                key="licenseTerm",
                label="License Term",
                hint="Duration of the license",
            ),
            DocumentField(
                key="fees",
                label="License Fees",
                type="long_text",
                required=False,
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Licensor", "Licensee"],
    ),
    "csa": _spec(
        id="csa",
        filename="CSA.md",
        fields=[
            DocumentField(
                key="productDescription",
                label="Cloud Service",
                hint="What service is being provided",
                type="long_text",
            ),
            DocumentField(
                key="subscriptionTerm",
                label="Subscription Term",
                hint="Duration of the subscription",
            ),
            DocumentField(
                key="fees",
                label="Subscription Fees",
                type="long_text",
                required=False,
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Provider", "Customer"],
    ),
    "sla": _spec(
        id="sla",
        filename="sla.md",
        fields=[
            DocumentField(
                key="targetUptime",
                label="Target Uptime",
                hint="e.g. 99.9%",
            ),
            DocumentField(
                key="targetResponseTime",
                label="Target Response Time",
                hint="e.g. 4 business hours for support requests",
            ),
            DocumentField(
                key="supportChannel",
                label="Support Channel",
                hint="How customers contact support (email, portal, etc.)",
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Provider", "Customer"],
    ),
    "dpa": _spec(
        id="dpa",
        filename="DPA.md",
        fields=[
            DocumentField(
                key="processingScope",
                label="Processing Scope",
                hint="What personal data is processed and for what purposes",
                type="long_text",
            ),
            DocumentField(
                key="dataCategories",
                label="Data Categories",
                hint="Types of personal data (e.g. names, emails, browsing data)",
                type="long_text",
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Controller", "Processor"],
    ),
    "baa": _spec(
        id="baa",
        filename="BAA.md",
        fields=[
            DocumentField(
                key="serviceDescription",
                label="Services",
                hint="What services the Business Associate performs involving PHI",
                type="long_text",
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Covered Entity", "Business Associate"],
    ),
    "psa": _spec(
        id="psa",
        filename="psa.md",
        fields=[
            DocumentField(
                key="servicesDescription",
                label="Services",
                hint="What services are being provided",
                type="long_text",
            ),
            DocumentField(
                key="fees",
                label="Fees",
                type="long_text",
                required=False,
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Provider", "Customer"],
    ),
    "ai_addendum": _spec(
        id="ai_addendum",
        filename="AI-Addendum.md",
        fields=[
            DocumentField(
                key="trainingData",
                label="Training Data",
                hint="Data the Provider is allowed to use for training (or 'none')",
                type="long_text",
                required=False,
            ),
            DocumentField(
                key="trainingPurposes",
                label="Training Purposes",
                hint="What the training may be used for",
                type="long_text",
                required=False,
            ),
            DocumentField(
                key="trainingRestrictions",
                label="Training Restrictions",
                hint="Limits on training (e.g. no use of personal data)",
                type="long_text",
                required=False,
            ),
            *_common_jurisdiction_fields(),
        ],
        party_roles=["Provider", "Customer"],
    ),
}


def list_specs() -> list[DocumentSpec]:
    return list(DOCUMENT_SPECS.values())


def get_spec(doc_id: str) -> DocumentSpec | None:
    return DOCUMENT_SPECS.get(doc_id)
