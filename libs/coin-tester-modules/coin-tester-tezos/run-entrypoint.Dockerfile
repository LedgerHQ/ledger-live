FROM oxheadalpha/flextesa:latest@sha256:fc6a223f366af7978275f3c01006b86d8fd487804cd44776da1977d5cd525a7b
COPY run-entrypoint.sh /run-entrypoint.sh
RUN chmod +x /run-entrypoint.sh
ENTRYPOINT ["/run-entrypoint.sh"]
