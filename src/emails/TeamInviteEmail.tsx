import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface TeamInviteEmailProps {
  inviterName?: string;
  workspaceName?: string;
  role?: string;
  inviteLink?: string;
}

export const TeamInviteEmail = ({
  inviterName = 'Alguém',
  workspaceName = 'Meu Workspace',
  role = 'Visualizador',
  inviteLink = 'https://www.zebro.site/invite',
}: TeamInviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Você foi convidado(a) para participar de um workspace no Zebro</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Convite de Equipe no <strong>Zebro</strong>
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Olá,
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>{inviterName}</strong> convidou você para colaborar no workspace <strong>{workspaceName}</strong>. 
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Você terá acesso com a permissão de <strong>{role}</strong>. Com esse acesso, você poderá colaborar na gestão de vídeos e configurações de acordo com seu cargo.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-4 py-3"
                href={inviteLink}
              >
                Aceitar Convite
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Se você não esperava por este convite, pode ignorar este e-mail.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Este e-mail foi enviado por Zebro.site
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TeamInviteEmail;
