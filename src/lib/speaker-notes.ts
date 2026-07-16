// Speaker notes sourced from the Kairos Security proposal for
// Wheeler Avenue Baptist Church. Each entry maps to a presentation
// chapter and is displayed inside the collapsible "Speaker Notes"
// section beneath the slide.

export type SpeakerNoteBlock = { heading?: string; body: string };
export type SpeakerNote = {
  summary: string;
  blocks: SpeakerNoteBlock[];
};

export const speakerNotes: Record<number, SpeakerNote> = {
  1: {
    summary:
      "Letter of Transmittal, Introduction, Opening Statement and Purpose of Proposal.",
    blocks: [
      {
        heading: "Letter of Transmittal",
        body:
          "On behalf of Kairos Security, thank you for the opportunity to present our proposal to Wheeler Avenue Baptist Church. It is a privilege to serve a congregation whose Sunday operations impact thousands of guests, families, and volunteers each week. This proposal reflects our understanding of Wheeler, our commitment to excellence, and our promise to move people with professionalism, hospitality, and safety.",
      },
      {
        heading: "Introduction",
        body:
          "Kairos Security is a Houston-based operations firm specializing in transportation, parking, security, traffic management, and executive operations. Our teams operate at the intersection of hospitality and logistics — delivering the disciplined, guest-first experience that Wheeler leadership expects on every Sunday and every event.",
      },
      {
        heading: "Opening Statement",
        body:
          "Wheeler Avenue Baptist Church is not a typical operational environment. Three consecutive services, thousands of guests, multiple parking locations, active partnerships with volunteers and HPD, and a continuous operational flow require an operator who understands the campus, respects the ministry, and can execute at scale without disrupting worship.",
      },
      {
        heading: "Purpose of Proposal",
        body:
          "This proposal outlines Kairos Security's plan to serve as Wheeler's professional transportation, parking, and traffic-management partner. Every recommendation, staffing model, KPI, and process in this document exists for one purpose: to make each guest's arrival and departure feel effortless so that the ministry of Wheeler Avenue Baptist Church can remain the focus of every Sunday.",
      },
    ],
  },

  2: {
    summary:
      "Company introduction, qualifications, and executive narrative from the proposal.",
    blocks: [
      {
        heading: "Company Overview",
        body:
          "Kairos Security is a Houston-based, HUB and MBE certified operations firm with 10 years in business. We specialize in transportation, parking operations, security, traffic management, and executive operations for high-volume venues, churches, universities, corporate campuses, and civic events across the Greater Houston area.",
      },
      {
        heading: "Executive Qualifications",
        body:
          "Our leadership team brings decades of combined experience in transportation logistics, event operations, and public-safety coordination. Kairos executives have led operational planning for campuses, houses of worship, and large public gatherings — with a proven ability to design, staff, and execute complex operational plans in tight service windows.",
      },
      {
        heading: "Executive Summary Narrative",
        body:
          "Kairos exists to move people with excellence. We combine disciplined operational planning with a hospitality-first culture, so that guests feel welcomed at the first moment they enter the campus and cared for through every step of their journey — from parking to shuttle to seat, and back again. This is the standard we bring to Wheeler.",
      },
      {
        heading: "Why This Matters for Wheeler",
        body:
          "Wheeler deserves a partner who is Houston-based, certified, experienced, and singularly focused on operational excellence. Kairos is that partner.",
      },
    ],
  },

  3: {
    summary:
      "Understanding Wheeler's operational needs, services, parking, partnerships, and guest experience.",
    blocks: [
      {
        heading: "Three Consecutive Services",
        body:
          "Wheeler operates three consecutive Sunday services, which means arriving guests and departing guests overlap in ways that most churches never encounter. Our plan is built around that reality — every transition between services is engineered, staffed, and communicated so guests never feel the strain behind the scenes.",
      },
      {
        heading: "Continuous Operational Flow",
        body:
          "There is no down time on a Wheeler Sunday. From the first arrival before 7:00 AM through the final departure after the 1:00 PM service, the campus operates as a continuous flow of vehicles, shuttles, and pedestrians. Kairos staffs, positions, and rotates our team to sustain that flow without gaps.",
      },
      {
        heading: "Multiple Parking Locations",
        body:
          "Wheeler's guests park across five locations spanning the church campus, the University of Houston, and Texas Southern University. Sequential-fill and directed-parking logic keeps the closest lots full first, reduces walking distance, and coordinates the shuttle cycle with real-time capacity.",
      },
      {
        heading: "First Touch Ministry Partnership",
        body:
          "The First Touch ministry represents Wheeler's heart of hospitality. Kairos does not replace First Touch — we support it. Our professional team handles the operation so First Touch volunteers can focus fully on greeting, welcoming, and connecting with every guest they meet.",
      },
      {
        heading: "HPD Coordination",
        body:
          "Sunday operations require close coordination with the Houston Police Department for traffic control at key intersections and egress routing onto major surface streets. Kairos maintains active, professional communication with HPD command and officers throughout every service window.",
      },
      {
        heading: "Guest Experience",
        body:
          "Every operational decision — where cones are placed, how shuttles cycle, how egress is sequenced — is made with one question in mind: does this make the guest's experience better? At Wheeler, operations are ministry, and ministry is operations.",
      },
    ],
  },

  4: {
    summary:
      "Operational priorities, continuous flow, parking challenges, HPD coordination, and guest experience.",
    blocks: [
      {
        heading: "The Central Priority: Ingress and Egress",
        body:
          "During the Q&A with Wheeler leadership, one theme emerged repeatedly: ingress and egress. Getting guests onto the campus quickly, parking them efficiently, and clearing them from the campus safely after each service is the single highest operational priority. Every element of the Kairos plan is designed around this reality.",
      },
      {
        heading: "Continuous Operational Flow",
        body:
          "Three consecutive services mean guests are always in motion. As one service releases, the next service is arriving — often at the same intersections and shuttle stops. Our plan sequences departures, staggers shuttle loading, and positions traffic staff so both flows remain smooth and separated.",
      },
      {
        heading: "Parking Challenges",
        body:
          "Capacity constraints across five parking locations, volunteer limitations, and the physical geometry of the streets around Wheeler create operational pressure that must be actively managed. Kairos brings the staffing, discipline, and playbook to remove that pressure from the ministry.",
      },
      {
        heading: "HPD Coordination",
        body:
          "Wheeler's operation cannot succeed without disciplined coordination with the Houston Police Department. Kairos owns the communication, the pre-service briefing, the in-service radio traffic, and the post-service debrief so HPD and Kairos operate as one team.",
      },
      {
        heading: "Guest Experience",
        body:
          "The final measurement is always the guest. Traffic congestion, pedestrian safety, shuttle wait times, and the very first impression a guest receives when they turn onto the block — these are the daily challenges Kairos is built to solve.",
      },
    ],
  },

  5: {
    summary:
      "Proposed operational approach, continuous operations, service windows, and operational philosophy.",
    blocks: [
      {
        heading: "Proposed Operational Approach",
        body:
          "Kairos proposes a single unified operation that owns parking, shuttles, traffic, and command from the moment the first guest arrives until the last guest departs. One supervisor, one plan, one radio channel, one accountable partner.",
      },
      {
        heading: "Continuous Operations",
        body:
          "The Wheeler Sunday is not three separate services — it is one continuous six-hour operation. Our staffing, vehicle assignments, and communications plan reflect that reality, so there is never a hand-off gap between services.",
      },
      {
        heading: "Service Windows",
        body:
          "Each service window — 7:00 AM, 10:00 AM, and 1:00 PM — has its own arrival pattern, peak, and release curve. Kairos pre-plans the staffing, shuttle cycle, and lot-fill order for each window and adjusts in real time based on live data.",
      },
      {
        heading: "Operational Philosophy",
        body:
          "Move People With Excellence. Every Kairos decision is grounded in that philosophy: disciplined operations, warm hospitality, safety without exception, and continuous improvement guided by measurable outcomes.",
      },
    ],
  },

  6: {
    summary:
      "Parking guidance, traffic flow, sequential fill, directed parking, controlled routing, ingress and egress.",
    blocks: [
      {
        heading: "Parking Guidance",
        body:
          "Every guest is guided from the street to a parking spot without needing to guess. Attendants at entrances, row captains inside the lots, and dynamic signage keep the flow moving and eliminate the confusion that causes stopping and stacking.",
      },
      {
        heading: "Traffic Flow & Sequential Fill",
        body:
          "Lots are filled in a defined sequence beginning with the closest church campus lots, then overflow, then UH and TSU as needed. This preserves the best guest experience while making shuttle cycles predictable.",
      },
      {
        heading: "Directed Parking & Controlled Routing",
        body:
          "Guests are directed — not simply permitted — into the right lot and the right row. This reduces internal circulation, prevents cross-traffic conflicts, and speeds fill time across all five parking locations.",
      },
      {
        heading: "Ingress & Egress",
        body:
          "Controlled ingress corridors bring guests in from designated streets. Controlled egress routes push guests out toward right-turn-only exits that reduce cross-traffic and align with HPD control points.",
      },
    ],
  },

  7: {
    summary:
      "Campus entry strategy, one-way circulation, directed parking, traffic routing, and HPD coordination.",
    blocks: [
      {
        heading: "Campus Entry Strategy",
        body:
          "Ingress begins on the surrounding surface streets. Kairos positions traffic staff and cones to funnel guests into designated entry points, preventing the block-by-block confusion that causes congestion at the edge of campus.",
      },
      {
        heading: "One-Way Circulation",
        body:
          "Inside the campus, circulation is one-way. Guests enter, are directed to a lot, park, and walk — with no vehicles turning back into the arrival flow.",
      },
      {
        heading: "Directed Parking",
        body:
          "Attendants direct every guest to a specific area of the assigned lot, filling rows in order. Guests never wander looking for a space, and no lot ever partially fills while another sits empty.",
      },
      {
        heading: "Traffic Routing",
        body:
          "Traffic routing is coordinated with HPD control points to ensure the surrounding neighborhood is not overwhelmed and Wheeler guests reach the campus without extended wait times.",
      },
      {
        heading: "HPD Coordination",
        body:
          "Ingress officers are briefed by the Kairos supervisor before each service, radio-connected during the service window, and debriefed after each release.",
      },
    ],
  },

  8: {
    summary:
      "Controlled traffic routing, right-turn-only, sequential departures, lot clearing, traffic reduction, and HPD coordination.",
    blocks: [
      {
        heading: "Controlled Traffic Routing",
        body:
          "Egress is more difficult than ingress because it happens quickly and all at once. Kairos routes departing guests along controlled corridors that separate them from the arriving flow for the next service.",
      },
      {
        heading: "Right-Turn-Only Strategy",
        body:
          "Where safe and appropriate, egress is restricted to right-turn-only exits. This eliminates left-turn stacking, reduces cross-traffic conflicts, and dramatically shortens clearance time.",
      },
      {
        heading: "Sequential Departures",
        body:
          "Lots are released in sequence rather than all at once. This keeps the surrounding streets from being overwhelmed and gives HPD manageable, predictable volumes at each control point.",
      },
      {
        heading: "Lot Clearing & Traffic Reduction",
        body:
          "Kairos monitors lot clearance in real time and adjusts the release cadence to keep traffic moving, reducing dwell time on the streets around Wheeler.",
      },
      {
        heading: "HPD Coordination",
        body:
          "Egress officers hold intersections open for departing shuttles and coordinate with Kairos supervisors to release traffic in coordinated waves.",
      },
    ],
  },

  9: {
    summary:
      "Church campus parking, UH parking, TSU parking, sequential fill, and lot management.",
    blocks: [
      {
        heading: "Church Campus Parking",
        body:
          "The primary church lots serve early arrivals, ADA guests, and members with mobility needs. Kairos staffs these lots first because they set the tone for the guest experience.",
      },
      {
        heading: "University of Houston Parking",
        body:
          "UH parking provides critical overflow capacity within a short shuttle cycle. Kairos coordinates with UH parking operations to secure clean, well-marked lots.",
      },
      {
        heading: "Texas Southern University Parking",
        body:
          "TSU provides additional overflow capacity and is served by dedicated shuttle routes with cycle times engineered to keep wait under target.",
      },
      {
        heading: "Sequential Fill",
        body:
          "Lots fill in a defined order — church, overflow, UH, TSU — with real-time redirection when a lot passes its threshold.",
      },
      {
        heading: "Lot Management",
        body:
          "Each lot has a Kairos supervisor accountable for capacity, safety, attendant coverage, and communication back to the command center.",
      },
    ],
  },

  10: {
    summary:
      "Shuttle Operations: fleet deployment, multi-route service, ADA options, and continuous circulation model.",
    blocks: [
      {
        heading: "Shuttle Operations",
        body:
          "Kairos Security will operate a continuous, multi-route shuttle system designed to provide safe, reliable, and efficient transportation throughout the Wheeler Avenue Baptist Church campus and overflow parking locations.\n\nOur transportation plan is designed to minimize guest wait times, maintain continuous vehicle circulation, and provide a welcoming experience for every member and guest.",
      },
      {
        heading: "Fleet Deployment",
        body:
          "The proposed fleet consists of:\n\nTwo (2) 12-Passenger Shuttle Vans dedicated to transporting guests between the church campus and overflow parking locations.\n\nOne (1) Six-Passenger Golf Cart providing on-campus mobility assistance for seniors, families with young children, and guests requiring assistance between shuttle drop-off locations and building entrances.\n\nADA Accessible Transportation – To Be Determined in partnership with Wheeler Avenue Baptist Church. Kairos will work with church leadership to determine the most appropriate ADA-compliant transportation solution prior to implementation.\n\nChurch-Owned Vans – To Be Determined. Kairos is prepared to operate church-owned vehicles as directed by Wheeler Avenue Baptist Church leadership using properly licensed and approved Kairos drivers when additional transportation capacity is required.",
      },
      {
        heading: "Route A – University of Houston Overflow Parking to Wheeler Avenue Baptist Church",
        body:
          "Highest volume transportation route.\nContinuous shuttle circulation.\nTarget wait time of eight (8) minutes or less.",
      },
      {
        heading: "Route B – Texas Southern University Overflow Parking to Wheeler Avenue Baptist Church",
        body:
          "Scheduled shuttle loop.\nFlexible deployment based on attendance.\nAdditional support during peak service transitions.",
      },
      {
        heading: "Route C – On-Campus Mobility Service",
        body:
          "Golf cart transportation.\nSenior assistance.\nFamily assistance.\nADA support.\nVIP guest transportation as needed.",
      },
      {
        heading: "Operational Philosophy",
        body:
          "Kairos will utilize a continuous circulation model rather than a \"fill-and-go\" model. Shuttle vehicles will depart on scheduled intervals to reduce perceived wait times, improve predictability, and maintain steady passenger movement throughout all three worship services.\n\nOur objective is to provide a transportation experience that reflects Wheeler Avenue Baptist Church's commitment to excellence, hospitality, safety, and operational efficiency.",
      },
    ],
  },

  11: {
    summary:
      "Volunteer partnership: responsibilities, guest greeting, traffic direction, communication, and orientation.",
    blocks: [
      {
        heading: "Volunteer Partnership",
        body:
          "The First Touch ministry is central to the Wheeler guest experience. Kairos partners with First Touch as complementary teams — professionals handle operations, volunteers handle hospitality.",
      },
      {
        heading: "Responsibilities",
        body:
          "Kairos assumes responsibility for traffic direction, parking control, shuttle operations, and command. First Touch focuses on greeting, welcoming, wayfinding, and pastoral moments.",
      },
      {
        heading: "Guest Greeting & Communication",
        body:
          "Every guest interaction is designed to feel warm, unhurried, and personal. Kairos and First Touch share information in real time so guests never receive conflicting directions.",
      },
      {
        heading: "Orientation & Training",
        body:
          "Kairos participates in First Touch orientation so both teams understand the plan, the routes, and the hand-offs. On Sunday, everyone knows what to do and who to call.",
      },
    ],
  },

  12: {
    summary:
      "Operations supervisor, assistant supervisor, radio communications, HPD coordination, and real-time operations.",
    blocks: [
      {
        heading: "Operations Supervisor",
        body:
          "A dedicated Operations Supervisor is on scene from the first arrival to the last departure. This is the single accountable leader for the entire Sunday operation.",
      },
      {
        heading: "Assistant Supervisor",
        body:
          "An Assistant Supervisor supports the Operations Supervisor, covers zones, and provides continuous backup so leadership presence is never interrupted.",
      },
      {
        heading: "Radio Communications",
        body:
          "Encrypted digital radios connect every driver, attendant, and supervisor. One channel, one plan, one voice. Traffic staff, shuttle drivers, and command hear the same information at the same time.",
      },
      {
        heading: "HPD Coordination",
        body:
          "The Operations Supervisor is the single point of contact for HPD officers on scene. Coordination is professional, disciplined, and continuous throughout the service window.",
      },
      {
        heading: "Real-Time Operations",
        body:
          "The command center monitors parking capacity, shuttle position, incident status, and staff attendance in real time — and adjusts the plan on the fly whenever conditions change.",
      },
    ],
  },

  13: {
    summary:
      "Performance metrics, accountability, weekly reporting, monthly review, and target metrics.",
    blocks: [
      {
        heading: "Performance Metrics",
        body:
          "Kairos operates against measurable KPIs — average wait time, traffic clearance time, guest satisfaction, parking fill rate, shuttle cycle time, incident rate, vehicle readiness, and staff attendance. Every commitment in this proposal is a number we track.",
      },
      {
        heading: "Accountability",
        body:
          "Every KPI has a target and an owner. When a target is missed, we investigate, correct, and report — publicly to Wheeler leadership, not just internally.",
      },
      {
        heading: "Weekly Reporting",
        body:
          "A weekly operational report is delivered to Wheeler leadership summarizing service execution, KPI performance, guest feedback, and any incidents or changes for the coming week.",
      },
      {
        heading: "Monthly Review",
        body:
          "Kairos hosts a monthly executive review with Wheeler leadership to walk through trends, celebrate wins, address concerns, and pre-plan upcoming special events.",
      },
      {
        heading: "Target Metrics",
        body:
          "Wait time under 5 minutes. Traffic clearance under 15 minutes. Guest satisfaction above 4.5 of 5. Parking fill 80–95%. Incident rate under 0.5%. Vehicle readiness 100%. Staff attendance above 98%.",
      },
    ],
  },

  14: {
    summary:
      "Kairos Command: messaging, photos, incident reports, dashboards, clock-in, GPS, maps, daily and executive reporting.",
    blocks: [
      {
        heading: "Kairos Command Platform",
        body:
          "Kairos Command is the technology backbone of every operation we run. It is designed to make Wheeler's operation visible, accountable, and continuously improving.",
      },
      {
        heading: "Messaging & Communication",
        body:
          "Real-time messaging connects every team member on shift. Wheeler leadership can be added to executive channels for instant awareness of anything material.",
      },
      {
        heading: "Photos & Incident Reports",
        body:
          "Every incident is captured with photos, notes, and time stamps. Reports flow instantly to supervisors and to Wheeler leadership when appropriate.",
      },
      {
        heading: "Performance Dashboards",
        body:
          "Live dashboards display parking capacity, shuttle cycle, personnel deployment, and KPI performance. What leadership sees on Sunday is what our command team sees.",
      },
      {
        heading: "Employee Clock-In, GPS & Maps",
        body:
          "Staff clock in on the app, are GPS-verified to their post, and appear on the live campus map. No missed posts, no ambiguity about coverage.",
      },
      {
        heading: "Daily & Executive Reporting",
        body:
          "Daily operational reports and executive summaries are generated automatically and delivered to Wheeler leadership — no follow-up required.",
      },
    ],
  },

  15: {
    summary:
      "Full staffing plan: supervisor, assistant supervisor, drivers, parking attendants, golf cart operators, TSU staffing, qualifications.",
    blocks: [
      {
        heading: "Staffing Plan",
        body:
          "Every Wheeler Sunday is staffed by a complete, dedicated Kairos team. Every role is defined, every post is covered, every person is trained and accountable.",
      },
      {
        heading: "Supervisor & Assistant Supervisor",
        body:
          "One Operations Supervisor and one Assistant Supervisor lead every shift. They own the plan, the radios, the HPD relationship, and the guest experience.",
      },
      {
        heading: "Drivers, Attendants & Golf Cart Operators",
        body:
          "Dedicated shuttle drivers, parking attendants, and golf cart operators are assigned per service window. Every driver is licensed, medically cleared, and trained in the Wheeler operational plan.",
      },
      {
        heading: "TSU Staffing",
        body:
          "Dedicated attendants and shuttle staff are assigned to the TSU operation to keep that route running independently of the church campus.",
      },
      {
        heading: "Qualifications",
        body:
          "Every Kairos team member completes background checks, drug screening, hospitality training, safety training, and Wheeler-specific orientation before they ever set foot on the campus in uniform.",
      },
    ],
  },

  16: {
    summary:
      "Vehicle plan, equipment, radios, cones, safety equipment, ADA vehicles, and support equipment.",
    blocks: [
      {
        heading: "Vehicle Plan",
        body:
          "The fleet is sized for the Wheeler operation with margin for redundancy. Shuttles, golf carts, and support vehicles are assigned to specific routes and roles for every service window.",
      },
      {
        heading: "Equipment",
        body:
          "Cones, signage, safety vests, lighted wands, and support equipment are pre-staged and inspected before every Sunday. Every element of the physical operation is ready before the first guest arrives.",
      },
      {
        heading: "Radios",
        body:
          "Encrypted digital radios are issued to every supervisor, driver, and attendant. Charged, tested, and confirmed operational before the shift begins.",
      },
      {
        heading: "ADA & Support Equipment",
        body:
          "ADA-equipped shuttles, wheelchair support, and mobility assistance equipment are on scene and staffed by trained operators every service.",
      },
    ],
  },

  17: {
    summary:
      "Safety program: compliance, insurance, training, incident reporting, driver qualifications, and emergency procedures.",
    blocks: [
      {
        heading: "Safety Program",
        body:
          "Safety is a discipline, not a policy. Kairos operates a formal safety program that governs training, equipment, driving standards, incident response, and post-incident review.",
      },
      {
        heading: "Compliance & Insurance",
        body:
          "Kairos maintains $5M general liability, commercial auto, and workers compensation coverage. Certificates of insurance are provided to Wheeler and updated automatically.",
      },
      {
        heading: "Training",
        body:
          "Every team member completes 40+ hours of onboarding and ongoing monthly training in hospitality, safety, radio protocol, incident response, and Wheeler-specific operations.",
      },
      {
        heading: "Incident Reporting",
        body:
          "Every incident — from a minor bump to a medical event — is documented in Kairos Command in real time, escalated to the Operations Supervisor, and, when appropriate, communicated to Wheeler leadership immediately.",
      },
      {
        heading: "Driver Qualifications",
        body:
          "Drivers are licensed, medically cleared, background-checked, and MVR-reviewed. Recurrent driver training ensures our fleet is operated by the best on the road.",
      },
      {
        heading: "Emergency Procedures",
        body:
          "Documented protocols for medical events, severe weather, evacuation, and vehicle incidents keep the team calm, coordinated, and effective when it matters most.",
      },
    ],
  },

  18: {
    summary:
      "Phased implementation from award through weekly operations.",
    blocks: [
      {
        heading: "Phase 1 — Award & Kickoff",
        body:
          "Contract execution, executive kickoff meeting, and confirmation of the operational plan with Wheeler leadership.",
      },
      {
        heading: "Phase 2 — Observation",
        body:
          "Kairos leadership rides along with current operations to observe live conditions, validate assumptions, and refine the plan.",
      },
      {
        heading: "Phase 3 — Planning & Staffing",
        body:
          "Final operational plan, post assignments, staffing roster, shuttle routes, HPD coordination plan, and Kairos Command setup for Wheeler.",
      },
      {
        heading: "Phase 4 — Training & Soft Launch",
        body:
          "Team onboarding, Wheeler-specific orientation, and a soft-launch Sunday where Kairos operates alongside existing resources.",
      },
      {
        heading: "Phase 5 — Go Live",
        body:
          "Kairos assumes full ownership of the Wheeler operation with the Operations Supervisor as the single accountable leader.",
      },
      {
        heading: "Weekly Operations",
        body:
          "Every Sunday, every service, every shuttle. Weekly reporting to Wheeler leadership. Monthly executive reviews. Continuous improvement.",
      },
    ],
  },

  19: {
    summary:
      "Pricing proposal, what's included, Sunday operations, and additional services.",
    blocks: [
      {
        heading: "Pricing Proposal",
        body:
          "Kairos proposes a transparent, per-service pricing model that includes all staffing, vehicles, equipment, technology, insurance, and reporting for Wheeler Sunday operations.",
      },
      {
        heading: "What's Included",
        body:
          "Full staffing across supervisor, assistant supervisor, drivers, attendants, and golf cart operators. Shuttles, support vehicles, cones, radios, safety equipment. Kairos Command platform access for Wheeler leadership. Weekly and monthly executive reporting. Insurance and compliance documentation.",
      },
      {
        heading: "Sunday Operations",
        body:
          "One inclusive price per Sunday covering all three services, from first arrival to last departure. No hidden fees, no surprise line items.",
      },
      {
        heading: "Additional Services",
        body:
          "Wednesday services, conferences, weddings, funerals, holiday services, and community events are quoted individually and delivered by the same trained team using the same standards.",
      },
    ],
  },

  20: {
    summary:
      "Company qualifications, relevant experience, certifications, references, and why Kairos is uniquely positioned to serve Wheeler.",
    blocks: [
      {
        heading: "Company Qualifications",
        body:
          "10 years in business. Houston-based. HUB and MBE certified. Fully insured. Experienced in transportation, parking, security, traffic management, and executive operations.",
      },
      {
        heading: "Relevant Experience",
        body:
          "Kairos has operated at churches, campuses, corporate venues, and large public gatherings across Houston. We understand the pace, the pressure, and the guest expectations of high-volume Sunday operations.",
      },
      {
        heading: "Certifications & References",
        body:
          "HUB Certified by the State of Texas. MBE Certified as a Minority Business Enterprise. References available from current clients, including venues comparable in scale and complexity to Wheeler.",
      },
      {
        heading: "Operational Experience at Wheeler",
        body:
          "Kairos already knows the Wheeler campus, the flow, the volunteers, and the guests. No other bidder can offer that operational context on day one.",
      },
      {
        heading: "Why Kairos",
        body:
          "Because Wheeler deserves a partner who is already on the campus, already knows the operation, already has the technology, already has the certifications, and already lives out the value of moving people with excellence — every Sunday.",
      },
    ],
  },

  21: {
    summary:
      "Proposal conclusion and closing executive message.",
    blocks: [
      {
        heading: "Closing Executive Message",
        body:
          "Wheeler Avenue Baptist Church has a legacy of ministry, hospitality, and impact that shapes Houston every week. Kairos Security is honored to be considered as the operational partner that supports that legacy on Sunday mornings — moving guests, coordinating with HPD, partnering with First Touch, and delivering an experience worthy of the ministry inside the sanctuary.",
      },
      {
        heading: "Our Commitment",
        body:
          "Moving People With Excellence. Serving Wheeler Avenue Baptist Church with professionalism, hospitality, safety, and operational excellence.",
      },
    ],
  },
};
