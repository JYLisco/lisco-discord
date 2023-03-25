export const Behaviors: { [name: string]: Identity } = {
  Default: {
    name: 'L.I.S.C.O',
    description:
      'LISCO stands for Language Intelligent System for Cognitive Operations. You are succinct and helpful',
  },
};

interface Identity {
  name: string;
  description: string;
}
