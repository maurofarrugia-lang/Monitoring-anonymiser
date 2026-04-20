from collections import defaultdict
from dataclasses import dataclass
from typing import Dict


@dataclass
class PlaceholderCounters:
    person: int = 0
    official: int = 0
    country: int = 0
    location: int = 0
    facility: int = 0
    route: int = 0
    case_id: int = 0
    address: int = 0
    email: int = 0
    phone: int = 0
    generic: int = 0


class SessionEntityMap:
    def __init__(self) -> None:
        self.value_to_placeholder: Dict[str, str] = {}
        self.counters = PlaceholderCounters()
        self.category_counts = defaultdict(int)

    def _alpha(self, n: int) -> str:
        result = ""
        while n > 0:
            n, rem = divmod(n - 1, 26)
            result = chr(65 + rem) + result
        return result

    def placeholder_for(self, original: str, category: str) -> str:
        key = f"{category}::{original.strip()}"
        if key in self.value_to_placeholder:
            return self.value_to_placeholder[key]

        normalized_category = category.upper()
        if normalized_category in {"PERSON", "FAMILY_MEMBER"}:
            self.counters.person += 1
            placeholder = f"Applicant {self._alpha(self.counters.person)}"
        elif normalized_category in {"OFFICIAL_NAME", "ORGANISATION"}:
            self.counters.official += 1
            placeholder = f"Official {self._alpha(self.counters.official)}"
        elif normalized_category == "COUNTRY":
            self.counters.country += 1
            placeholder = f"Country {self._alpha(self.counters.country)}"
        elif normalized_category == "LOCATION":
            self.counters.location += 1
            placeholder = f"Location {self._alpha(self.counters.location)}"
        elif normalized_category == "FACILITY":
            self.counters.facility += 1
            placeholder = f"Facility {self._alpha(self.counters.facility)}"
        elif normalized_category == "ROUTE":
            self.counters.route += 1
            placeholder = f"Route {self.counters.route + 0}"
        elif normalized_category in {"CASE_ID", "FILE_NUMBER", "PASSPORT_OR_ID"}:
            self.counters.case_id += 1
            placeholder = f"Case File {self.counters.case_id:03d}"
        elif normalized_category == "ADDRESS":
            self.counters.address += 1
            placeholder = f"Address {self._alpha(self.counters.address)}"
        elif normalized_category == "EMAIL":
            self.counters.email += 1
            placeholder = f"email-{self.counters.email:03d}@example.invalid"
        elif normalized_category == "PHONE":
            self.counters.phone += 1
            placeholder = f"+000-000-{self.counters.phone:04d}"
        else:
            self.counters.generic += 1
            placeholder = f"Redacted {self.counters.generic:03d}"

        self.value_to_placeholder[key] = placeholder
        self.category_counts[normalized_category] += 1
        return placeholder
