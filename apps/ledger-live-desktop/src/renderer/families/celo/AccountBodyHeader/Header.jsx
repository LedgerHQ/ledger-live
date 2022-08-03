// @flow

import React from "react";
import { Trans } from "react-i18next";
import { HeaderWrapper } from "~/renderer/components/TableContainer";
import * as S from "./Header.styles";

export const Header = () => (
  <HeaderWrapper>
    <S.TableLine>
      <Trans i18nKey="celo.delegation.validatorGroup" />
    </S.TableLine>
    <S.TableLine>
      <Trans i18nKey="delegation.status" />
    </S.TableLine>
    <S.TableLine>
      <Trans i18nKey="delegation.delegated" />
    </S.TableLine>
    <S.TableLine />
  </HeaderWrapper>
);
