# DASD-A2-MULTI_AGENT_SYSTEM

Skills to be attained and checked:
* Understanding of MAS principles - where and how to apply it.
* Ability to model and solve problem using the MAS methodology.
* Ability to apply the MAS methodology for distributed automation systems.

Task description:

The production system (physically located in Ri208, simulator of the system - http://escop.rd.tut.fi:3000) is composed of 12 work stations. The line makes mobile phones that can come in 729 variations (3 screen shapes * 3 colours * 3 keyboard shapes * 3 colours * 3 frame shapes * 3 colours). 10 workstations (WS2-WS6; WS8-WS12) are in charge of making mentioned frames, screens and keyboards. A product can be seen as a combination of a frame, a screen and a keyboard.

FASTory production line

The line should be controlled using MAS (Multi-Agent System). You have to identify what is an agent in the context of given production line, then implement the agents using Node.js and demonstrate the approach by actually controlling the line.

As a system receives an order to make a mobile phone, the agents should negotiate between each other developing the way to make the phone and then executing actual production of the phone.
