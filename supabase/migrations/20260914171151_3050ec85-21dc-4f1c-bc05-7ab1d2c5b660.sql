CREATE TABLE public.consulting_parking_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Observation',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_parking_counts TO service_role;
ALTER TABLE public.consulting_parking_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY consulting_parking_counts_service_only ON public.consulting_parking_counts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.consulting_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Under Review',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_decisions TO service_role;
ALTER TABLE public.consulting_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY consulting_decisions_service_only ON public.consulting_decisions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.consulting_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Needs Verification',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_checklist TO service_role;
ALTER TABLE public.consulting_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY consulting_checklist_service_only ON public.consulting_checklist
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER consulting_parking_counts_touch BEFORE UPDATE ON public.consulting_parking_counts
  FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();
CREATE TRIGGER consulting_decisions_touch BEFORE UPDATE ON public.consulting_decisions
  FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();
CREATE TRIGGER consulting_checklist_touch BEFORE UPDATE ON public.consulting_checklist
  FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

CREATE INDEX consulting_parking_counts_date_idx ON public.consulting_parking_counts (occurred_on DESC);
CREATE INDEX consulting_decisions_date_idx ON public.consulting_decisions (occurred_on DESC);
CREATE INDEX consulting_checklist_date_idx ON public.consulting_checklist (occurred_on DESC);

INSERT INTO public.consulting_briefings (title, status, occurred_on, data) VALUES (
  'Wheeler Parking Assessment — September 13, 2026',
  'Published',
  '2026-09-13',
  jsonb_build_object(
    'phase','Assessment / Traffic & Parking Optimization',
    'serviceOrEvent','Sunday Field Observation — September 13, 2026',
    'summary','The September 13 parking assessment identified several visibility, traffic-control, signage, shuttle-bus parking, parking utilization, and ingress/egress concerns.

Immediate priorities include:
• Improving officer visibility on Scott Street.
• Improving egress management at the Blodgett Street exit.
• Removing Sunday parking from Ruth Street.
• Establishing an improved shuttle-bus staging location.
• Coordinating with HPD regarding traffic-control procedures.
• Improving directional signage throughout the parking system.
• Improving Rosewood/TSU parking identification and traffic control.
• Establishing clear one-way traffic patterns.
• Protecting ADA parking while evaluating shuttle-bus alternatives.

Leadership decisions are required before several recommendations can be implemented.',
    'keyFindings','Scott Street is extremely dark during early-morning traffic operations. The Blodgett Street main exit is the critical egress-control point and was obstructed by a parked vehicle and trash container. 12 vehicles were parallel parked on Ruth Street in an area needed for circulation and possible shuttle staging. Yellow A/B reached FULL by 7:45 AM. All handicap spaces in the Blue Handicap Lot were full at 6:30 AM and all 12 CLC handicap spaces were occupied at 6:45 AM. Rosewood/TSU S3 working capacity recorded as 233 spaces — NEEDS VERIFICATION.',
    'assessments','Sunday field observation of Green, Red A/B/C, Purple, Yellow A/B/C/D, Blue Handicap, Christian Life Center, Ruth Street, Rosewood/TSU S3, University of Houston, TSU Blodgett lot and the strip center across from Ruth Street. Timed counts recorded between 6:00 AM and 10:00 AM.',
    'recommendations','Approved officer-visibility equipment on Scott Street; HPD coordination for Blodgett egress holds; Sunday no-parking on Ruth Street; relocation of shuttle-bus staging with an ADA alternative plan; directional and one-way signage in Yellow, Red, Purple and Green; Lawson mandatory-left-turn sign; Wheeler parking identification signs and a minimum of six cones at Rosewood; chains or approved barriers at one-way control points; 3–4 traffic-control personnel at the Blodgett main exit during peak egress.',
    'nextSteps','Obtain leadership decisions on budget, purchasing authority, Ruth Street restrictions, shuttle staging, ADA alternatives, Blodgett staffing and physical barriers. Complete the Next Sunday Verification checklist during the next walkthrough.',
    'preparedBy','Kairos Security'
  )
);

INSERT INTO public.consulting_site_visits (title, status, occurred_on, data) VALUES (
  'Sunday Field Observation — Wheeler Parking Assessment (Sept 13, 2026)',
  'Follow-Up Required',
  '2026-09-13',
  jsonb_build_object(
    'arrival','06:00','departure','10:00',
    'location','Wheeler Avenue Baptist Church',
    'lotsReviewed','Green, Red A/B/C, Purple, Yellow A/B/C/D, Blue Handicap, Christian Life Center, Ruth Street, Rosewood/TSU S3, University of Houston, TSU lot on Blodgett, strip center across from Ruth Street',
    'trafficConditions','Dark conditions on Scott Street during early-morning operations. Shuttle-bus movement through the main aisle at the Blodgett exit required other traffic to stop. Egress coordination became a major operational priority around 10:00 AM at the main Blodgett Street exit.',
    'problems','Officer visibility on Scott Street; obstruction in the Blodgett egress corridor; Ruth Street parallel parking; insufficient directional and one-way signage; Rosewood parking identification and traffic control; shuttle-bus staging conflicting with three occupied handicap spaces.',
    'recommended','See recommendations and action items for September 13, 2026.',
    'followUps','Next Sunday Verification checklist.'
  )
);

INSERT INTO public.consulting_parking_counts (title, status, occurred_on, data) VALUES
('Green Lot','Observation','2026-09-13',jsonb_build_object('lot','Green Lot','observedAt','06:00','regular',10,'handicap',6,'notes','10 regular vehicles and 6 handicap vehicles observed.')),
('Green Lot','Observation','2026-09-13',jsonb_build_object('lot','Green Lot','observedAt','07:45','available',54,'notes','54 spaces available.')),
('Red A / Purple','Observation','2026-09-13',jsonb_build_object('lot','Red A / Purple','observedAt','06:00','totalVehicles',42,'notes','42 total vehicles observed in Red A and Purple areas.')),
('Red Reserved Parking','Observation','2026-09-13',jsonb_build_object('lot','Red — Reserved','observedAt','06:00','totalVehicles',1,'reservedSpaces','3 reserved spaces: Deacon Chair, Deaconess Chair, Trustee Chair.','notes','1 vehicle occupying the Deaconess Chair reserved space.')),
('Red C — early observation','Needs Verification','2026-09-13',jsonb_build_object('lot','Red C','totalVehicles',1,'notes','Early observation: 1 vehicle. Exact observation time not recorded — NEEDS VERIFICATION.')),
('Purple Lot','Observation','2026-09-13',jsonb_build_object('lot','Purple Lot','observedAt','07:45','available',155,'notes','155 spaces available.')),
('Red C','Observation','2026-09-13',jsonb_build_object('lot','Red C','observedAt','07:45','available',75,'notes','75 spaces available.')),
('Red B','Observation','2026-09-13',jsonb_build_object('lot','Red B','observedAt','07:45','available',4,'notes','4 spaces available.')),
('Yellow A/B','Observation','2026-09-13',jsonb_build_object('lot','Yellow A/B','observedAt','06:25','totalVehicles',108,'notes','108 vehicles.')),
('Yellow C','Observation','2026-09-13',jsonb_build_object('lot','Yellow C','observedAt','06:25','totalVehicles',14,'notes','14 vehicles.')),
('Yellow A/B — FULL','Observation','2026-09-13',jsonb_build_object('lot','Yellow A/B','observedAt','07:45','full','Yes','notes','Yellow A/B FULL at 7:45 AM.')),
('Yellow C/D','Observation','2026-09-13',jsonb_build_object('lot','Yellow C/D','observedAt','07:45','available',44,'notes','44 combined spaces available.')),
('Rosewood / TSU S3','Observation','2026-09-13',jsonb_build_object('lot','Rosewood / TSU S3','observedAt','06:36','totalVehicles',126,'capacity',233,'notes','126 vehicles. Working capacity recorded as 233 spaces — confirm during next walkthrough.')),
('Rosewood / TSU S3 — approx. 7:17 AM','Needs Verification','2026-09-13',jsonb_build_object('lot','Rosewood / TSU S3','observedAt','07:17','available',46,'notes','46 spaces reportedly available at approximately 7:17 AM. Count and time NEED VERIFICATION.')),
('Rosewood / TSU S3','Observation','2026-09-13',jsonb_build_object('lot','Rosewood / TSU S3','observedAt','08:00','available',36,'personnel','2 police officers positioned at Rosewood and Scott.','notes','36 spaces available.')),
('University of Houston — main area closest to Wheeler Avenue','Observation','2026-09-13',jsonb_build_object('lot','University of Houston','totalVehicles',76,'notes','76 vehicles observed in the main UH parking area closest to Wheeler Avenue.')),
('Strip center across from Ruth Street','Observation','2026-09-13',jsonb_build_object('lot','Strip center (across from Ruth Street)','observedAt','06:40','totalVehicles',41,'personnel','2 officers appeared to be working the lot.','notes','41 vehicles.')),
('TSU lot on Blodgett','Observation','2026-09-13',jsonb_build_object('lot','TSU lot on Blodgett','totalVehicles',8,'notes','8 vehicles observed.')),
('Blue Handicap Lot — FULL','Observation','2026-09-13',jsonb_build_object('lot','Blue Handicap Lot','observedAt','06:30','full','Yes','notes','All handicap spaces FULL.')),
('Christian Life Center handicap & reserved parking','Needs Verification','2026-09-13',jsonb_build_object('lot','Christian Life Center','observedAt','06:45','handicap',12,'full','Yes','reservedSpaces','Reserved spaces identified for: Counseling Minister, Minister of Christian Education, Mr. Hulon Lester.','notes','All 12 handicap spaces occupied. The Counseling Minister space remained available at 6:45 AM; only one reserved space was reported available. The assignments involving Christian Education and Mr. Lester may contain duplicated or unclear information — NEEDS VERIFICATION.')),
('Ruth Street','Safety Concern','2026-09-13',jsonb_build_object('lot','Ruth Street','totalVehicles',12,'handicap',3,'full','Yes','notes','12 vehicles parallel parked along Ruth Street. 3 handicap spaces located near the proposed shuttle-bus staging area, all 3 occupied. Do not mark these spaces available for shuttle operations.')),
('Blodgett Street entry gate opened','Needs Verification','2026-09-13',jsonb_build_object('lot','Blodgett Street entry gate','observedAt','08:54','notes','At approximately 8:54 AM the entry gate was opened for vehicles waiting on Blodgett Street. Person opening the gate: UNKNOWN / NEEDS VERIFICATION.')),
('Blodgett Street egress coordination','Action Required','2026-09-13',jsonb_build_object('lot','Blodgett Street main exit','observedAt','10:00','notes','At approximately 10:00 AM egress coordination became a major operational priority, particularly at the main Blodgett Street exit.'));

INSERT INTO public.consulting_recommendations (title, status, occurred_on, data) VALUES
('Safety Hazard #1 — Scott Street Officer Visibility','Safety Concern','2026-09-13',jsonb_build_object('priority','Critical','decision','Under Review','location','Scott Street','problem','Scott Street is extremely dark during early-morning traffic operations. Officers have flashlights and yellow reflective vests, but motorists may still have difficulty seeing personnel directing traffic.','solution','Evaluate approved flashing LED safety lights, illuminated traffic batons and additional reflective traffic-control equipment. Confirm equipment is approved by Wheeler leadership, law enforcement and applicable traffic-control requirements before deployment.')),
('Safety Hazard #2 — Blodgett Street Egress Obstruction','Safety Concern','2026-09-13',jsonb_build_object('priority','High','decision','Under Review','location','Blodgett Street','problem','A vehicle and trash container were positioned along the right side of Blodgett Street within the intended egress corridor. Sunday no-parking signs are already present.','solution','Document the obstruction and coordinate removal/clearance before dismissal.')),
('Safety Hazard #3 — Ruth Street Parking','Safety Concern','2026-09-13',jsonb_build_object('priority','High','decision','Under Review','location','Ruth Street','problem','12 vehicles were observed parallel parked along Ruth Street. This area is needed for traffic circulation and potentially shuttle-bus operations.','solution','Evaluate establishing Ruth Street as a Sunday no-parking zone.')),
('Traffic Flow — Blodgett Street Main Exit','Action Required','2026-09-13',jsonb_build_object('priority','Critical','decision','Under Review','location','Blodgett Street main exit','problem','The main Blodgett exit serving the Red, Purple and Green parking areas is a significant egress-control point. Shuttle buses travel through the main aisle and attempt to turn right, requiring other traffic to stop.','solution','Recommended staffing: minimum 3 traffic-control personnel; preferred 4 during peak dismissal. Positions: (1) internal lot traffic, (2) shuttle-bus movement, (3) Blodgett Street traffic, (4) pedestrian/cross-traffic monitoring. Coordinate with HPD officers controlling Blodgett Street and evaluate temporarily holding eastbound and westbound traffic when necessary to allow vehicles to exit the main parking system.')),
('Traffic Flow — Lawson Street mandatory left turn','Pending Approval','2026-09-13',jsonb_build_object('priority','High','decision','Under Review','location','Lawson Street','problem','All southbound vehicles traveling Lawson Street, except shuttle buses, should turn left.','solution','Install proposed sign: "ALL TRAFFIC MUST TURN LEFT — SHUTTLE BUSES EXEMPT".')),
('Traffic Flow — One-way control points','Pending Approval','2026-09-13',jsonb_build_object('priority','Medium','decision','Under Review','location','One-way control points currently marked with cones','problem','Several one-way points are controlled only by cones, allowing vehicles to enter against the intended traffic flow.','solution','Evaluate chains or another approved barrier at locations currently controlled only by cones.')),
('Signage — Rosewood','Pending Approval','2026-09-13',jsonb_build_object('priority','Medium','decision','Under Review','location','Rosewood','solution','Wheeler Avenue Parking identification signs; minimum 6 traffic cones every Sunday.')),
('Signage — Ruth Street','Pending Approval','2026-09-13',jsonb_build_object('priority','High','decision','Under Review','location','Ruth Street','solution','Portable Sunday No-Parking signs covering both entrances and the restricted parking area. Research portable signage through approved vendors.')),
('Signage — Yellow lots one-way arrows','Pending Approval','2026-09-13',jsonb_build_object('priority','High','decision','Under Review','location','Yellow lots','solution','6 one-way LEFT-arrow signs and 6 one-way RIGHT-arrow signs.')),
('Signage — Red / Purple one-way arrows','Pending Approval','2026-09-13',jsonb_build_object('priority','High','decision','Under Review','location','Red / Purple lots','solution','6 one-way LEFT-arrow signs and 6 one-way RIGHT-arrow signs.')),
('Signage — Green directional signs','Needs Verification','2026-09-13',jsonb_build_object('priority','High','decision','Under Review','location','Green lot','solution','6 directional signs. Arrow directions NEED VERIFICATION during the next walkthrough.')),
('Signage — Lawson Street','Pending Approval','2026-09-13',jsonb_build_object('priority','High','decision','Under Review','location','Lawson Street','solution','1 sign: "ALL TRAFFIC MUST TURN LEFT — SHUTTLE BUSES EXEMPT".')),
('Equipment — Scott Street visibility','Pending Approval','2026-09-13',jsonb_build_object('priority','Critical','decision','Under Review','location','Scott Street','solution','Approved flashing visibility equipment, illuminated traffic batons and additional reflective equipment if required.'));

INSERT INTO public.consulting_notes (title, status, occurred_on, data) VALUES
('Police & Security Staffing — September 13, 2026','Executive Leadership','2026-09-13',jsonb_build_object('category','Field Observation','author','Kairos Security','content','Rosewood / Scott: 2 police officers observed directing traffic.
Strip center: 2 officers appeared to be working the parking area.
Blodgett exit: recommended minimum staffing of 3 traffic-control personnel; preferred peak staffing of 4.
Status: Pending Approval.'));

INSERT INTO public.consulting_action_items (title, status, occurred_on, data) VALUES
('Improve officer visibility on Scott Street','Pending Approval','2026-09-13',jsonb_build_object('priority','Critical','relatedArea','Scott Street','description','Evaluate and deploy approved flashing LED safety lights, illuminated traffic batons and additional reflective traffic-control equipment.')),
('Coordinate Blodgett main-lot exit strategy with HPD','Action Required','2026-09-13',jsonb_build_object('priority','Critical','relatedArea','Blodgett Street main exit','description','Coordinate egress procedures with HPD officers controlling Blodgett Street, including temporary holds of eastbound and westbound traffic.')),
('Pilot removal of parked vehicles/shuttle buses from Ruth Street','Recommendation','2026-09-13',jsonb_build_object('priority','High','relatedArea','Ruth Street','description','Pilot clearing Ruth Street of parked vehicles and shuttle buses to restore circulation.')),
('Evaluate moving shuttle-bus staging from Ruth Street to designated CLC-side area','Pending Approval','2026-09-13',jsonb_build_object('priority','High','relatedArea','Ruth Street / Christian Life Center','description','Evaluate relocating shuttle-bus staging to a designated CLC-side area.')),
('Develop ADA/accessibility plan before changing use of the three handicap spaces near proposed bus staging','Action Required','2026-09-13',jsonb_build_object('priority','Critical','relatedArea','Ruth Street handicap spaces','description','No handicap space may be repurposed until an ADA alternative is documented and approved.')),
('Establish Sunday Ruth Street no-parking restriction','Pending Approval','2026-09-13',jsonb_build_object('priority','High','relatedArea','Ruth Street','description','Establish Ruth Street as an official Sunday no-parking zone.')),
('Purchase portable Ruth Street no-parking signs','Pending Approval','2026-09-13',jsonb_build_object('priority','High','relatedArea','Ruth Street','description','Portable Sunday No-Parking signs covering both entrances and the restricted parking area.')),
('Obtain Wheeler parking identification signs for Rosewood','Pending Approval','2026-09-13',jsonb_build_object('priority','Medium','relatedArea','Rosewood','description','Wheeler Avenue Parking identification signage at Rosewood.')),
('Assign minimum six cones to Rosewood every Sunday','Action Required','2026-09-13',jsonb_build_object('priority','Medium','relatedArea','Rosewood','description','Minimum 6 traffic cones assigned to Rosewood every Sunday.')),
('Install directional signage in Yellow, Red, Purple and Green lots','Pending Approval','2026-09-13',jsonb_build_object('priority','High','relatedArea','Yellow / Red / Purple / Green lots','description','One-way LEFT and RIGHT arrow signs in Yellow and Red/Purple; 6 directional signs in Green (arrow directions NEED VERIFICATION).')),
('Install Lawson mandatory-left-turn sign','Pending Approval','2026-09-13',jsonb_build_object('priority','High','relatedArea','Lawson Street','description','Sign reading "ALL TRAFFIC MUST TURN LEFT — SHUTTLE BUSES EXEMPT".')),
('Review chains/approved physical barriers at one-way points','Pending Approval','2026-09-13',jsonb_build_object('priority','Medium','relatedArea','One-way control points','description','Review chains or other approved physical barriers where only cones are used today.')),
('Assign minimum 3 and preferably 4 traffic-control personnel to Blodgett main exit during peak egress','Pending Approval','2026-09-13',jsonb_build_object('priority','Critical','relatedArea','Blodgett Street main exit','description','Staffing positions: internal lot traffic, shuttle-bus movement, Blodgett Street traffic, pedestrian/cross-traffic monitoring.')),
('Develop written shuttle-bus routing and parking diagram','Action Required','2026-09-13',jsonb_build_object('priority','High','relatedArea','Shuttle operations','description','Produce a written shuttle-bus routing and parking diagram for leadership review.'));

INSERT INTO public.consulting_decisions (title, status, occurred_on, data) VALUES
('What budget is approved for signs, cones, barriers and officer-visibility equipment?','Under Review','2026-09-13',jsonb_build_object('priority','Critical','question','What budget is approved for signs, cones, barriers and officer-visibility equipment?')),
('Who has authority to purchase equipment?','Under Review','2026-09-13',jsonb_build_object('priority','High','question','Who has authority to purchase equipment?')),
('What purchasing/approval process should Kairos follow?','Under Review','2026-09-13',jsonb_build_object('priority','High','question','What purchasing/approval process should Kairos follow?')),
('Can Ruth Street officially become a Sunday no-parking zone?','Under Review','2026-09-13',jsonb_build_object('priority','High','question','Can Ruth Street officially become a Sunday no-parking zone?')),
('Where should the three shuttle buses be permanently staged?','Under Review','2026-09-13',jsonb_build_object('priority','High','question','Where should the three shuttle buses be permanently staged?')),
('What ADA alternatives will be provided if existing handicap spaces are affected?','Under Review','2026-09-13',jsonb_build_object('priority','Critical','question','What ADA alternatives will be provided if existing handicap spaces are affected?')),
('Can Blodgett exit staffing increase to 3–4 personnel?','Under Review','2026-09-13',jsonb_build_object('priority','Critical','question','Can Blodgett exit staffing increase to 3–4 personnel?')),
('Who will coordinate the egress strategy with HPD?','Under Review','2026-09-13',jsonb_build_object('priority','Critical','question','Who will coordinate the egress strategy with HPD?')),
('Are chains or physical barriers approved at one-way control points?','Under Review','2026-09-13',jsonb_build_object('priority','Medium','question','Are chains or physical barriers approved at one-way control points?'));

INSERT INTO public.consulting_checklist (title, status, occurred_on, data) VALUES
('Verify 7:17 AM Rosewood count/time','Needs Verification','2026-09-13',jsonb_build_object('item','Verify the approximately 7:17 AM Rosewood count and time.')),
('Verify CLC reserved-space assignments','Needs Verification','2026-09-13',jsonb_build_object('item','Verify Christian Life Center reserved-space assignments (Counseling Minister, Minister of Christian Education, Mr. Hulon Lester).')),
('Verify Green directional-sign arrow requirements','Needs Verification','2026-09-13',jsonb_build_object('item','Verify the arrow directions required for the 6 Green lot directional signs.')),
('Identify person/position responsible for opening Blodgett gate','Needs Verification','2026-09-13',jsonb_build_object('item','Identify the person or position responsible for opening the Blodgett Street entry gate.')),
('Verify exact Ruth Street shuttle-bus staging location','Needs Verification','2026-09-13',jsonb_build_object('item','Verify the exact Ruth Street shuttle-bus staging location.')),
('Verify ADA alternative before changing handicap spaces','Needs Verification','2026-09-13',jsonb_build_object('item','Verify the ADA alternative before changing the use of any handicap spaces.')),
('Verify equipment approval requirements','Needs Verification','2026-09-13',jsonb_build_object('item','Verify approval requirements for visibility and traffic-control equipment.')),
('Confirm officer deployment at Blodgett','Needs Verification','2026-09-13',jsonb_build_object('item','Confirm officer deployment at the Blodgett Street exit.')),
('Confirm Rosewood capacity of 233','Needs Verification','2026-09-13',jsonb_build_object('item','Confirm the Rosewood / TSU S3 working capacity of 233 spaces.')),
('Photograph traffic-control problem areas','Needs Verification','2026-09-13',jsonb_build_object('item','Photograph traffic-control problem areas.')),
('Document Blodgett peak egress conditions','Needs Verification','2026-09-13',jsonb_build_object('item','Document Blodgett Street peak egress conditions.'));

INSERT INTO public.consulting_before_after (title, status, occurred_on, data)
SELECT t, 'In Progress', NULL, jsonb_build_object('location', loc, 'baseline', b, 'afterResult','Pending Implementation & Measurement')
FROM (VALUES
 ('Scott Street officer visibility','Scott Street','Baseline September 13, 2026: Scott Street is extremely dark during early-morning traffic operations; officers rely on flashlights and yellow reflective vests.'),
 ('Ruth Street parking','Ruth Street','Baseline September 13, 2026: 12 vehicles parallel parked along Ruth Street; 3 handicap spaces near the proposed shuttle staging area all occupied.'),
 ('Shuttle-bus staging','Ruth Street / Christian Life Center','Baseline September 13, 2026: shuttle buses staged on Ruth Street; no permanent designated staging area established.'),
 ('Blodgett exit congestion','Blodgett Street main exit','Baseline September 13, 2026: egress coordination became a major operational priority around 10:00 AM; shuttle-bus right turns require other traffic to stop; obstruction present in the egress corridor.'),
 ('Rosewood traffic control','Rosewood / TSU S3','Baseline September 13, 2026: no Wheeler parking identification signage; 2 officers at Rosewood and Scott; cone assignment not standardized.'),
 ('One-way directional compliance','Yellow, Red, Purple and Green lots','Baseline September 13, 2026: one-way points controlled only by cones; vehicles able to enter against intended flow.'),
 ('Parking signage','All parking areas','Baseline September 13, 2026: directional and one-way signage missing in Yellow, Red, Purple and Green lots.'),
 ('Lawson traffic movement','Lawson Street','Baseline September 13, 2026: no sign directing southbound traffic to turn left with a shuttle-bus exemption.')
) AS v(t, loc, b);

UPDATE public.consulting_project
SET status = 'Assessment',
    phase = 'Assessment / Traffic & Parking Optimization',
    next_action = 'Next Sunday verification walkthrough',
    summary = 'Wheeler Parking Assessment — September 13, 2026 (In Progress). The September 13 parking assessment identified several visibility, traffic-control, signage, shuttle-bus parking, parking utilization, and ingress/egress concerns. Immediate priorities: Scott Street officer visibility, Blodgett Street egress management, removal of Sunday parking from Ruth Street, improved shuttle-bus staging, HPD traffic-control coordination, directional signage, Rosewood/TSU identification and traffic control, clear one-way traffic patterns, and protection of ADA parking. Leadership decisions are required before several recommendations can be implemented.'
WHERE id = 'default';