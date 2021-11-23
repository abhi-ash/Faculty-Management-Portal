# Faculty-Management-Portal

# Project Description
You are expected to develop a faculty leave portal for an academic university. For this project, you are expected to
develop code for both the front-end UI and the back-end of the system. Given that this course focuses on topics related to
databases systems, we would expect a more thorough effort on the database part of the project. However, there should be a
bare minimum effort on front-end UI as well.
Faculty in an academic university are largely divided into two categories: (a) Faculty and (d) cross-cutting faculty (e.g.,
Deans and Associate Deans etc.). People in each of these categories are formed into a hierarchy with the Director at the
top most level. And as expected, people participating in this hierarchy (at various roles) change with time. Your design
must allow for such changes and should also keep a track of it. Following is a brief background on the hierarchy of
faculty (in an IIT):

Faculty: Faculty are divided into departments (e.g., CS, EE, ME, Civil, etc.). Each department has a
head-of-department (HoD) who is also one of the faculty members in the department. Each HoD appointment is a
time bound appointment and is thus associated with a start-date and end-date.
Cross-cutting Faculty: In any institute, we do have some faculty who are not associated with any particular
department. Examples of this include, Dean Faculty Affairs, Dean Academic Affairs, Dean Research and Dean
Student Affairs. All Deans are faculty who have been appointed to the said post for a certain duration. And during
the period they hold the Dean position, they are deemed to be a “cross cutting faculty.”


# Concepts relevant to faculty:
Leave applications: From time-to-time, faculty can go on a leave. Depending on the post of the applicant,
his/her leave application would go through a specific route. For instance, leave application of a faculty follows the
following route for approval: Faculty → HoD → Dean Faculty Affairs. In each stage, the person forwards with
comments. Finally Dean Faculty Affairs approves or rejects. After approval, leave is deducted from the available
leaves and an intimation is sent to faculty.
Note that leave applications of HoDs and Deans are approved directly by the Director. Two more things to
note here: (a) each employee has a fixed number of leaves per year (and they expire at the end of the year). (b)
Sometimes, HoD, concerned head, and/or Dean FAA may redirect the application to the employee for more
comments. Once approved (or rejected), the concerned faculty is intimated. Also note that the concerned faculty
should be able to see the current position of the leave application and all the comments made on it by different
entities. These comments can also be seen by HoD and Dean Faculty Affairs.

Assume the following Depts in Faculty: CSE, ME and EE. Each Dept has an HoD. HoD is a current faculty of the dept.
Assume the following Deans: Dean Faculty Affairs (any of the current faculty can become Dean for a certain duration).
Assume one Director: And everybody comes under the Director. Director is also a faculty in any one of the departments.

# Portals to be implemented:
● Basic Employee Portals: Each of the employees would have their own personal portals. Portals should have the
following: (a) Personal Information, (b)Total number leaves available this year, (c) Status of the leave applications
(including the comments added by various entities, (d) Options to start new leave applications, (e) Respond to
comments made on leave applications.
● Specialized Portals: Each of the named positions such as HoD, Dean and Director would have specialized portals
for handling the applications. Note that all the specialized portal logins must be tied up with an employee
(implicity). For e.g., consider a faculty named Dr Rajesh in the CSE dept. When he becomes the HoD of the CSE
dept, his login should now have options to approve/reject/make comments on the leave applications of the CSE
dept faculty. And his own leave applications would now go to the Director. These features should be removed
when he steps down from the HoD position.

# Constraints:
● Complete Paper Trail Needs to Maintained in the system: Information on “Who signed what and when” must
always be stored in the database. Even if an employee leaves the institute, there should be a record on what all did
he/she approve. Similar is the case when HoDs or Deans change. Note that all the specialized portal login must
be tied up with an employee. For instance, if a faculty signs an application via his/her Deans login, then
appropriate information regarding this must be stored in the database.
● An employee can launch only one leave application at a time.
● Your design should have relevant security features. For instance, a faculty should not have write access to the
field/table containing Dean’s comments (or HoD comments) on leave applications, he/she can only read it.
● Director has the authority to change the HoD and Dean appointments. In other words, appointing HoD or Dean
should be an option in the Director’s portal.
● Change of HoD or Dean FAA: Whenever there is a change in HoD or Dean FAA, then all the pending (i.e., they
have not been either rejected or approved) applications should be automatically forwarded to the new person. It
should also have comments made by the previous person (as needed).
● One can apply for leave only for the future dates. In case a faculty applies for leave for past dates, it will be called
as “retrospective leave” and the following route needs to be followed in that case: Faculty → HoD → Dean
Faculty Affairs → Director. This does not apply to HoD and Deans as they leave applications goes to the
Director anyways. In this case faculty must write a reason for not applying leave before.
● In case the leave is not approved/rejected before the start date of the leave, then it is automatically “rejected by the
system.” Appropriate comments should be appended to the application by the system that the application was
automatically rejected by the system as the application was not approved/rejected by the proposed start date.
● In case someone requests for more number of leaves than what he/she currently has, then after approval a system
generated message should be attached to the application stating that he/she does not have enough leaves. And
deduct whatever max number of leaves are possible.
● If HoD rejects a leave application, then it cannot be forwarded to Dean FAA.
